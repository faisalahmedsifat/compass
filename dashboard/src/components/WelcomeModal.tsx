import React from 'react';
import { X, Compass, Camera, BarChart3, Brain, Zap } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">🎉 Welcome to Enhanced Compass!</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your Productivity Intelligence System
            </h3>
            <p className="text-gray-600">
              Compass now provides comprehensive insights into your work patterns, 
              energy levels, and productivity optimization opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-semibold text-blue-900 mb-2">Overview Dashboard</h4>
              <p className="text-sm text-blue-700">
                Real-time workspace state, flow indicators, and key metrics at a glance.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg border border-cyan-200">
              <div className="w-8 h-8 text-cyan-600 mb-3 flex items-center justify-center text-lg">📅</div>
              <h4 className="font-semibold text-cyan-900 mb-2">Timeline View</h4>
              <p className="text-sm text-cyan-700">
                Google Calendar-like timeline showing your activity patterns by hour, day, week, or month.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <Zap className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-semibold text-purple-900 mb-2">Advanced Analytics</h4>
              <p className="text-sm text-purple-700">
                Focus heatmaps, app efficiency radar, energy correlations, and behavioral patterns.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <Brain className="w-8 h-8 text-green-600 mb-3" />
              <h4 className="font-semibold text-green-900 mb-2">AI Insights</h4>
              <p className="text-sm text-green-700">
                Personalized recommendations and optimization strategies powered by AI analysis.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <Camera className="w-8 h-8 text-orange-600 mb-3" />
              <h4 className="font-semibold text-orange-900 mb-2">Screenshot Gallery</h4>
              <p className="text-sm text-orange-700">
                Visual timeline of your activities with automatic screenshot capture and context.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-lg border border-pink-200">
              <div className="w-8 h-8 text-pink-600 mb-3 flex items-center justify-center text-lg">🎯</div>
              <h4 className="font-semibold text-pink-900 mb-2">Flow State Tracking</h4>
              <p className="text-sm text-pink-700">
                Real-time flow state detection with quality metrics and optimization tips.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200">
              <div className="w-8 h-8 text-indigo-600 mb-3 flex items-center justify-center text-lg">⚡</div>
              <h4 className="font-semibold text-indigo-900 mb-2">Smart Recommendations</h4>
              <p className="text-sm text-indigo-700">
                Context-aware suggestions for productivity improvement and energy management.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">🚀 What's New in This Version</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span><strong>Four-Tab Interface:</strong> Overview, Timeline, Analytics, and Insights for comprehensive analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span><strong>Calendar Timeline:</strong> Google Calendar-like view with hour/day/week/month granularity</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>Visual Screenshots:</strong> See what you were actually working on during productive periods</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span><strong>Focus Heatmaps:</strong> Discover your peak productivity hours and energy patterns</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><strong>AI-Powered Insights:</strong> Get personalized recommendations based on your work patterns</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span><strong>Real-Time Flow State:</strong> Live monitoring of your focus quality and productivity state</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              🎯 Start Exploring Your Productivity Data
            </button>
            <p className="text-xs text-gray-500 mt-3">
              The more you use Compass, the more personalized insights you'll receive!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
