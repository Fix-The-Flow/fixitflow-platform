import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MascotContext = createContext();

const mascotCharacters = {
  wizard: {
    name: 'Wizard Wesley',
    emoji: '🧙‍♂️',
    personality: 'wise and encouraging',
    color: '#8B5CF6'
  },
  robot: {
    name: 'Robo Helper',
    emoji: '🤖',
    personality: 'logical and efficient',
    color: '#06B6D4'
  },
  cat: {
    name: 'Whiskers',
    emoji: '🐱',
    personality: 'curious and playful',
    color: '#F59E0B'
  },
  dog: {
    name: 'Buddy',
    emoji: '🐕',
    personality: 'friendly and loyal',
    color: '#EF4444'
  },
  bear: {
    name: 'Bruno',
    emoji: '🐻',
    personality: 'gentle and supportive',
    color: '#8B5A2B'
  }
};

const defaultTips = {
  welcome: [
    "Welcome to FixItFlow! I'm here to help you solve any problem. 🌟",
    "Ready to fix something? Let's make it happen together! 💪",
    "Hey there! I've got tons of tips to help you succeed. Let's dive in! 🚀"
  ],
  encouragement: [
    "You're doing great! Keep going! 💪",
    "Don't give up - you've got this! 🌟",
    "Every expert was once a beginner. You're learning! 📚",
    "Take your time, there's no rush. Quality over speed! ⏰"
  ],
  completion: [
    "Fantastic work! You've completed another guide! 🎉",
    "Mission accomplished! Ready for the next challenge? 🏆",
    "You're becoming quite the problem-solver! 🌟"
  ],
  safety: [
    "Safety first! Make sure you have the right protective equipment. 🦺",
    "When in doubt, ask for help or consult a professional. 👷‍♂️",
    "Take breaks if you need them - rushing can lead to mistakes! ⏸️"
  ]
};

export const MascotProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentCharacter, setCurrentCharacter] = useState('wizard');
  const [isVisible, setIsVisible] = useState(true);
  const [currentTip, setCurrentTip] = useState(null);
  const [tipHistory, setTipHistory] = useState([]);

  // Initialize mascot preferences from user settings
  useEffect(() => {
    if (user?.preferences?.mascotEnabled !== undefined) {
      setIsVisible(user.preferences.mascotEnabled);
    }
  }, [user]);

  // Show tip function
  const showTip = (context, customMessage = null, duration = 5000) => {
    if (!isVisible) return;

    let message = customMessage;
    
    if (!message && defaultTips[context]) {
      const tips = defaultTips[context];
      message = tips[Math.floor(Math.random() * tips.length)];
    }

    if (message) {
      const tip = {
        id: Date.now(),
        message,
        context,
        character: currentCharacter,
        timestamp: new Date()
      };

      setCurrentTip(tip);
      setTipHistory(prev => [tip, ...prev.slice(0, 9)]); // Keep last 10 tips

      // Auto-hide tip after duration
      setTimeout(() => {
        setCurrentTip(null);
      }, duration);
    }
  };

  // Hide current tip
  const hideTip = () => {
    setCurrentTip(null);
  };

  // Toggle mascot visibility
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  // Change mascot character
  const changeCharacter = (character) => {
    if (mascotCharacters[character]) {
      setCurrentCharacter(character);
    }
  };

  // Get character info
  const getCharacterInfo = (character = currentCharacter) => {
    return mascotCharacters[character] || mascotCharacters.wizard;
  };

  // Show contextual tips based on page or action
  const showContextualTip = (page, action = null) => {
    if (!isVisible) return;

    let context = 'welcome';
    let customMessage = null;

    switch (page) {
      case 'home':
        context = 'welcome';
        break;
      case 'guide':
        if (action === 'start') {
          customMessage = "Let's tackle this step by step! I'll be here if you need encouragement. 🎯";
        } else if (action === 'complete') {
          context = 'completion';
        } else {
          customMessage = "Take your time reading through each step. You've got this! 📖";
        }
        break;
      case 'search':
        customMessage = "Looking for something specific? Try different keywords if you don't find what you need! 🔍";
        break;
      case 'ebooks':
        customMessage = "These eBooks contain the best of our guides, perfectly organized for you! 📚";
        break;
      case 'checkout':
        customMessage = "Great choice! This eBook will be a valuable addition to your toolkit. 💎";
        break;
      default:
        context = 'welcome';
    }

    showTip(context, customMessage);
  };

  const value = {
    currentCharacter,
    isVisible,
    currentTip,
    tipHistory,
    characters: mascotCharacters,
    showTip,
    hideTip,
    toggleVisibility,
    changeCharacter,
    getCharacterInfo,
    showContextualTip
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
};

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};
