package com.trustora.app.ui.screens.admin

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonParser
import com.trustora.app.core.models.AdminNewsletterLanguageFilter
import com.trustora.app.core.models.AdminNewsletterRecipientParser
import com.trustora.app.core.models.AdminNewsletterSubscriber
import com.trustora.app.core.models.AdminNewsletterUserTypeFilter
import com.trustora.app.core.models.AdminSendNewsletterPayload
import com.trustora.app.core.models.AppCurrency
import com.trustora.app.core.repository.AppContainer
import com.trustora.app.core.utils.asStringOrNull
import com.trustora.app.core.utils.objectOrNull
import com.trustora.app.core.utils.stringOrNull
import kotlinx.coroutines.launch
import retrofit2.HttpException

class AdminNewsletterViewModel(
    private val appContainer: AppContainer,
) : ViewModel() {
    var templates by mutableStateOf<List<String>>(emptyList())
        private set
    var selectedTemplate by mutableStateOf("")
    var templateContent by mutableStateOf("")
        private set

    var subject by mutableStateOf("")
    var recipientsInput by mutableStateOf("")
    var dataInput by mutableStateOf("")
    var userTypeFilter by mutableStateOf(AdminNewsletterUserTypeFilter.ALL)
    var languageFilter by mutableStateOf(AdminNewsletterLanguageFilter.RO)
    var onlyActiveSubscribers by mutableStateOf(true)
    var perPage by mutableStateOf(25)

    var subscribers by mutableStateOf<List<AdminNewsletterSubscriber>>(emptyList())
        private set
    var totalSubscribers by mutableStateOf(0)
        private set
    var currentPage by mutableStateOf(1)
        private set
    var lastPage by mutableStateOf(1)
        private set

    var isLoading by mutableStateOf(false)
        private set
    var isLoadingTemplateContent by mutableStateOf(false)
        private set
    var isSubmitting by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var actionErrorMessage by mutableStateOf<String?>(null)
    var successMessage by mutableStateOf<String?>(null)

    fun load(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoading) return
        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            runCatching {
                val fetchedTemplates = appContainer.dashboardRepository.getAdminNewsletterTemplates(
                    language = language,
                    currency = currency,
                    token = token,
                )
                templates = fetchedTemplates

                if (selectedTemplate.isBlank()) {
                    selectedTemplate = fetchedTemplates.firstOrNull().orEmpty()
                } else if (selectedTemplate !in fetchedTemplates && fetchedTemplates.isNotEmpty()) {
                    selectedTemplate = fetchedTemplates.first()
                }

                if (selectedTemplate.isNotBlank()) {
                    templateContent = appContainer.dashboardRepository.getAdminNewsletterTemplateContent(
                        template = selectedTemplate,
                        language = language,
                        currency = currency,
                        token = token,
                    )
                } else {
                    templateContent = ""
                }

                val collection = appContainer.dashboardRepository.getAdminNewsletterSubscribers(
                    language = language,
                    currency = currency,
                    token = token,
                    perPage = perPage,
                    onlyActive = onlyActiveSubscribers,
                )
                subscribers = collection.subscribers
                totalSubscribers = collection.total
                currentPage = collection.currentPage
                lastPage = collection.lastPage
            }.onFailure { error ->
                templates = emptyList()
                selectedTemplate = ""
                templateContent = ""
                subscribers = emptyList()
                totalSubscribers = 0
                currentPage = 1
                lastPage = 1
                errorMessage = resolvedMessage(error)
            }

            isLoading = false
        }
    }

    fun loadTemplateContent(
        template: String,
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        val trimmedTemplate = template.trim()
        selectedTemplate = trimmedTemplate
        if (trimmedTemplate.isEmpty()) {
            templateContent = ""
            return
        }

        if (isLoadingTemplateContent) return
        isLoadingTemplateContent = true
        actionErrorMessage = null

        viewModelScope.launch {
            val content = runCatching {
                appContainer.dashboardRepository.getAdminNewsletterTemplateContent(
                    template = trimmedTemplate,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                ""
            }
            templateContent = content
            isLoadingTemplateContent = false
        }
    }

    fun loadSubscribers(
        token: String,
        language: String,
        currency: AppCurrency,
    ) {
        if (isLoading) return
        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            runCatching {
                val collection = appContainer.dashboardRepository.getAdminNewsletterSubscribers(
                    language = language,
                    currency = currency,
                    token = token,
                    perPage = perPage,
                    onlyActive = onlyActiveSubscribers,
                )
                subscribers = collection.subscribers
                totalSubscribers = collection.total
                currentPage = collection.currentPage
                lastPage = collection.lastPage
            }.onFailure { error ->
                subscribers = emptyList()
                totalSubscribers = 0
                currentPage = 1
                lastPage = 1
                errorMessage = resolvedMessage(error)
            }
            isLoading = false
        }
    }

    fun sendNewsletter(
        token: String,
        language: String,
        currency: AppCurrency,
        onCompleted: (Boolean) -> Unit,
    ) {
        val template = selectedTemplate.trim()
        val trimmedSubject = subject.trim()
        if (template.isEmpty() || trimmedSubject.isEmpty()) {
            actionErrorMessage = "Template and subject are required."
            onCompleted(false)
            return
        }

        isSubmitting = true
        actionErrorMessage = null
        successMessage = null

        viewModelScope.launch {
            val payload = AdminSendNewsletterPayload(
                template = template,
                subject = trimmedSubject,
                data = parseDataInput(dataInput).takeIf { it.isNotEmpty() },
                userType = userTypeFilter.rawValue,
                recipients = AdminNewsletterRecipientParser.parse(recipientsInput).takeIf { it.isNotEmpty() },
                language = languageFilter.rawValue,
            )

            val sentCount = runCatching {
                appContainer.dashboardRepository.sendAdminNewsletter(
                    payloadData = payload,
                    language = language,
                    currency = currency,
                    token = token,
                )
            }.getOrElse { error ->
                actionErrorMessage = resolvedMessage(error)
                -1
            }

            val success = sentCount >= 0
            if (success) {
                successMessage = if (sentCount > 0) {
                    "Newsletter sent to $sentCount recipients."
                } else {
                    "Newsletter sent."
                }
            }
            isSubmitting = false
            onCompleted(success)
        }
    }

    private fun parseDataInput(value: String): Map<String, String> {
        val payload = linkedMapOf<String, String>()
        value.lineSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach { line ->
                val separatorIndex = line.indexOfFirst { it == ':' || it == '=' }
                if (separatorIndex <= 0 || separatorIndex == line.lastIndex) {
                    return@forEach
                }
                val key = line.substring(0, separatorIndex).trim()
                val itemValue = line.substring(separatorIndex + 1).trim()
                if (key.isNotEmpty() && itemValue.isNotEmpty()) {
                    payload[key] = itemValue
                }
            }
        return payload
    }

    private fun resolvedMessage(error: Throwable): String {
        if (error is HttpException) {
            val errorBody = runCatching { error.response()?.errorBody()?.string() }.getOrNull()
            if (!errorBody.isNullOrBlank()) {
                extractMessage(errorBody)?.let { return it }
            }
            return "HTTP ${error.code()}"
        }
        return error.message ?: "Unknown error"
    }

    private fun extractMessage(payload: String): String? {
        val root = runCatching { JsonParser.parseString(payload).asJsonObject }.getOrNull() ?: return payload
        val errors = root.objectOrNull("errors")
        if (errors != null) {
            errors.entrySet().forEach { (_, value) ->
                if (value.isJsonArray && value.asJsonArray.size() > 0) {
                    value.asJsonArray[0].asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
                }
                value.asStringOrNull()?.takeIf { it.isNotBlank() }?.let { return it }
            }
        }

        root.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }
        root.objectOrNull("data")?.stringOrNull("message", "error")?.takeIf { it.isNotBlank() }?.let { return it }

        return payload
    }

    class Factory(
        private val appContainer: AppContainer,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return AdminNewsletterViewModel(appContainer) as T
        }
    }
}
