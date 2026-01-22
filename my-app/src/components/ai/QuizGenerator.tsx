"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MockAIService, Quiz, QuizQuestion } from '@/lib/ai-service';
import { Loader2, HelpCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizGeneratorProps {
  content: string;
}

export function QuizGenerator({ content }: QuizGeneratorProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const result = await MockAIService.generateQuiz(content);
      setQuiz(result);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) correct++;
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuiz(null);
    setSelectedAnswers({});
    setShowResults(false);
    setCurrentQuestionIndex(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Generating questions...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center p-6 text-center h-40">
          <HelpCircle className="h-8 w-8 text-cyan-400 mb-2" />
          <h3 className="font-semibold text-sm mb-1">Generate Quiz</h3>
          <p className="text-xs text-muted-foreground">
            Test your knowledge based on the note's content.
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-cyan-500/20 flex justify-between gap-2">
          <Button className="w-full" onClick={handleGenerate} disabled={!content}>
            Create Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <h3 className="font-bold text-lg mb-1">Quiz Complete!</h3>
          <p className="text-sm">You scored {score} / {quiz.questions.length}</p>
        </div>
        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="text-sm border p-3 rounded-md">
              <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswers[q.id] === i;
                  const isCorrect = q.correctAnswer === i;

                  let bgClass = "bg-transparent";
                  if (isCorrect) bgClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
                  else if (isSelected && !isCorrect) bgClass = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";

                  return (
                    <div key={i} className={cn("p-2 rounded flex items-center justify-between text-xs", bgClass)}>
                      <span>{opt}</span>
                      {isCorrect && <CheckCircle className="h-3 w-3" />}
                      {isSelected && !isCorrect && <XCircle className="h-3 w-3" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={resetQuiz} className="w-full gap-2">
          <RotateCcw className="h-4 w-4" /> Start New Quiz
        </Button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnsweredCurrent = selectedAnswers[currentQuestion.id] !== undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center text-xs text-muted-foreground">
        <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
        <span className="font-mono text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">{quiz.title}</span>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium mb-4">{currentQuestion.question}</p>
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectOption(currentQuestion.id, idx)}
              className={cn(
                "w-full text-left p-3 rounded-md border text-xs transition-all",
                selectedAnswers[currentQuestion.id] === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-muted"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-cyan-500/20 flex justify-between gap-2">
        <Button
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          size="sm"
        >
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
            size="sm"
          >
            Finish Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!hasAnsweredCurrent}
            size="sm"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
