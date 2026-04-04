'use client';

export const dynamic = 'force-dynamic';

import { SelectTestsList } from './_components/select-tests-list';
import { SelectTestsLoadingState } from './_components/select-tests-loading-state';
import { SelectTestsResultScreen } from './_components/select-tests-result-screen';
import { SelectTestsRunner } from './_components/select-tests-runner';
import { useSelectTestsPageController } from './_hooks/use-select-tests-page-controller';

export default function SelectTestsPageClient() {
    const {
        answers,
        currentQuestionIndex,
        currentTest,
        error,
        handleAnswerChange,
        handleBack,
        handleExamViolationFailed,
        handleStartRequested,
        handleStartWarningConfirm,
        handleStartWarningOpenChange,
        handleSubmitTest,
        hasRoleInfo,
        isInitialGenerationProcessing,
        isProvider,
        isRefreshingRole,
        key,
        loading,
        loadingResults,
        loadingTests,
        nextQuestion,
        previousQuestion,
        serviceTests,
        showQuestions,
        startWarningOpen,
        testCompleted,
        testData,
        testInProgress,
        testResult,
        timeRemaining,
        user,
        userLoading,
    } = useSelectTestsPageController();

    if (loading || userLoading || isRefreshingRole) {
        return (
            <SelectTestsLoadingState
                animationKey={key}
                fullscreen
                mode="generating"
                showQuestions={showQuestions}
            />
        );
    }

    if (!user || (hasRoleInfo && !isProvider)) {
        return null;
    }

    if (loadingResults) {
        return (
            <SelectTestsLoadingState
                animationKey={key}
                mode="waitingResult"
                showQuestions={showQuestions}
            />
        );
    }

    if (loadingTests || isInitialGenerationProcessing) {
        return (
            <SelectTestsLoadingState
                animationKey={key}
                mode="generating"
                showQuestions={showQuestions}
            />
        );
    }

    if (testCompleted && testResult && currentTest) {
        return (
            <SelectTestsResultScreen
                answers={answers}
                currentTest={currentTest}
                testResult={testResult}
                user={user}
            />
        );
    }

    if (testInProgress && currentTest) {
        return (
            <SelectTestsRunner
                answers={answers}
                currentQuestionIndex={currentQuestionIndex}
                currentTest={currentTest}
                onAnswerChange={handleAnswerChange}
                onExamViolationFailed={handleExamViolationFailed}
                onNextQuestion={nextQuestion}
                onPreviousQuestion={previousQuestion}
                onSubmitTest={handleSubmitTest}
                timeRemaining={timeRemaining}
            />
        );
    }

    return (
        <SelectTestsList
            error={error}
            loadingTests={loadingTests}
            onBack={handleBack}
            onStartRequested={handleStartRequested}
            onStartWarningConfirm={handleStartWarningConfirm}
            onStartWarningOpenChange={handleStartWarningOpenChange}
            serviceTests={serviceTests}
            startWarningOpen={startWarningOpen}
            testData={testData}
        />
    );
}
