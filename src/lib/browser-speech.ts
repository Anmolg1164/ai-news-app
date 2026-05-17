
"use client";

/**
 * @fileOverview Client-side utility for the Web Speech API (speechSynthesis).
 * Uses standard locale tags for device-agnostic voice selection across all browsers.
 */

// Keep a reference to the utterance to prevent garbage collection issues on long texts
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Stops any ongoing speech synthesis and clears the active utterance.
 */
export const stopBrowserSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

/**
 * Speaks the provided text using the browser's native Speech Synthesis API.
 * Prioritizes Indian English (en-IN) without hardcoding specific voice names.
 * 
 * @param text - The string to read aloud.
 * @param onEnd - Optional callback triggered when speech completes.
 */
export const speakText = (text: string, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  // Ensure any previous speech is terminated before starting new one
  stopBrowserSpeech();

  if (!text || text.trim() === "") {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  
  // Fetch available voices - handle browsers where this might be empty initially
  const voices = window.speechSynthesis.getVoices();
  
  /**
   * Selection Strategy:
   * 1. Find a voice matching the 'en-IN' (Indian English) locale exactly.
   * 2. Fallback to any voice starting with 'en' (English).
   * 3. Fallback to the browser's default voice.
   */
  const indianVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') || 
                      voices.find(v => v.lang.startsWith('en')) || 
                      voices[0];

  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  // Consistent pacing for news and spiritual content
  utterance.pitch = 1.0;
  utterance.rate = 0.92; // Slightly slower for better clarity on device speakers
  utterance.volume = 1.0;

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    // 'interrupted' and 'canceled' are common when a user clicks a new button; we ignore these.
    const ignoredErrors = ['interrupted', 'canceled'];
    if (!ignoredErrors.includes(event.error)) {
      console.warn("SpeechSynthesis issue:", event.error);
    }
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
