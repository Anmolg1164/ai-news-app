
"use client";

/**
 * @fileOverview Client-side utility for the Web Speech API (speechSynthesis).
 * Optimized for Indian English accents and global audio control.
 */

// Keep a reference to the utterance to prevent garbage collection issues
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const stopBrowserSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const speakText = (text: string, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  // Stop any current speech before starting new one
  stopBrowserSpeech();

  if (!text || text.trim() === "") {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  
  // Find an Indian English voice
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) || 
                      voices.find(v => v.lang.startsWith('en')) || 
                      voices[0];

  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  utterance.pitch = 1.0;
  utterance.rate = 0.95; // Slightly slower for better clarity
  utterance.volume = 1.0;

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    // Interrupted or Canceled are normal when switching audio; ignore them to prevent dev-mode overlays
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.warn("SpeechSynthesis non-fatal issue:", event.error);
    }
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
