import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Settings } from 'lucide-react';
import { useMascot } from '../../contexts/MascotContext';

const MascotAssistant = () => {
  const {
    currentCharacter,
    isVisible,
    currentTip,
    characters,
    hideTip,
    toggleVisibility,
    changeCharacter,
    getCharacterInfo,
    showTip
  } = useMascot();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const characterInfo = getCharacterInfo();

  // Auto-show welcome tip on first load
  useEffect(() => {
    const hasShownWelcome = localStorage.getItem('mascot-welcome-shown');
    if (!hasShownWelcome && isVisible) {
      setTimeout(() => {
        showTip('welcome');
        localStorage.setItem('mascot-welcome-shown', 'true');
      }, 2000);
    }
  }, [isVisible, showTip]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleVisibility}
          className="w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
          title="Show mascot assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="mascot-container">
      {/* Tip Bubble */}
      <AnimatePresence>
        {currentTip && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl p-4 max-w-xs border border-gray-200"
            style={{ borderTopColor: characterInfo.color }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {characterInfo.name}
              </span>
              <button
                onClick={hideTip}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {currentTip.message}
            </p>
            
            {/* Bubble arrow */}
            <div
              className="absolute bottom-0 right-6 transform translate-y-full"
              style={{ 
                width: 0, 
                height: 0, 
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `8px solid ${characterInfo.color}`
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl p-4 w-72 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Mascot Settings</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Assistant
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(characters).map(([key, character]) => (
                    <button
                      key={key}
                      onClick={() => changeCharacter(key)}
                      className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                        currentCharacter === key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{character.emoji}</div>
                      <div className="text-xs font-medium text-gray-600">
                        {character.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Show Assistant
                </span>
                <button
                  onClick={toggleVisibility}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    isVisible ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isVisible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Character */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="w-16 h-16 rounded-full shadow-lg cursor-pointer flex items-center justify-center animate-mascot-float"
          style={{ backgroundColor: characterInfo.color }}
          onClick={() => showTip('encouragement')}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="text-3xl">{characterInfo.emoji}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
        >
          <Settings className="w-3 h-3 text-gray-600" />
        </button>

        {/* Hover hint */}
        <AnimatePresence>
          {isHovered && !currentTip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full right-0 mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              Click for encouragement!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MascotAssistant;
