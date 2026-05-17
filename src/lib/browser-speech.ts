
"use client";

/**
 * @fileOverview Client-side utility for the Web Speech API (speechSynthesis).
 * Optimized for Indian English accents and global audio control.
 */

export const stopBrowserSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const speakText = (text: string, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("Speech synthesis not supported");
    return;
  }

  // Stop any current speech
  stopBrowserSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  
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
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesis error:", event);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};
