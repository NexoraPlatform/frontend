package com.trustora.app.di

import com.trustora.app.core.network.TrustoraApi
import okhttp3.OkHttpClient
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkModule {
    private const val BASE_URL = "http://10.0.2.2:8000/api/"

    fun baseApiUrl(): HttpUrl = BASE_URL.toHttpUrl()

    fun createHttpClient(): OkHttpClient {
        val logger = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val original = chain.request()
                val request = original.newBuilder().apply {
                    if (original.header("Accept").isNullOrBlank()) {
                        header("Accept", "application/json")
                    }
                }.build()
                chain.proceed(request)
            }
            .addInterceptor(logger)
            .build()
    }

    fun createTrustoraApi(client: OkHttpClient = createHttpClient()): TrustoraApi {
        val baseUrl = baseApiUrl()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TrustoraApi::class.java)
    }
}
