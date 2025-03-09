import React, { useState } from 'react';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { Button } from '../components/ui/components';
import { Save, User } from 'lucide-react';
import { UserProfile } from '@clerk/clerk-react';

export default function UserSettings() {
  const [paperPreferences, setPaperPreferences] = useState({
    defaultStyle: 'APA',
    defaultWordCount: 2000,
    preferredSections: ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'],
    plagiarismCheckEnabled: true,
    grammarCheckEnabled: true,
    citationFormatting: true,
  });

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setPaperPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSavePreferences = () => {
    // In a real app, we would save these preferences to a backend
    // For now, we'll just show a success message
    alert('Preferences saved successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary dark:text-neutral">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Account Settings */}
          <div className="md:col-span-2 bg-neutral dark:bg-primary rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-primary dark:text-neutral mb-6 flex items-center">
              <User size={20} className="mr-2" />
              Account Settings
            </h2>
            <div className="clerk-profile-container">
              <UserProfile 
                appearance={{
                  elements: {
                    card: "shadow-none border-0 p-0",
                    navbar: "hidden",
                    pageScrollBox: "p-0",
                    profilePage: {
                      width: "100%",
                      maxWidth: "100%"
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Paper Preferences */}
          <div className="bg-neutral dark:bg-primary rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-primary dark:text-neutral mb-6">Paper Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Citation Style
                </label>
                <select 
                  name="defaultStyle"
                  value={paperPreferences.defaultStyle}
                  onChange={handlePreferenceChange}
                  className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <option value="APA">APA</option>
                  <option value="MLA">MLA</option>
                  <option value="Chicago">Chicago</option>
                  <option value="Harvard">Harvard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Word Count
                </label>
                <input 
                  type="number"
                  name="defaultWordCount"
                  value={paperPreferences.defaultWordCount}
                  onChange={handlePreferenceChange}
                  className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality Checks
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      name="plagiarismCheckEnabled"
                      checked={paperPreferences.plagiarismCheckEnabled}
                      onChange={handlePreferenceChange}
                      className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Plagiarism Check
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      name="grammarCheckEnabled"
                      checked={paperPreferences.grammarCheckEnabled}
                      onChange={handlePreferenceChange}
                      className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Grammar Check
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      name="citationFormatting"
                      checked={paperPreferences.citationFormatting}
                      onChange={handlePreferenceChange}
                      className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Auto-format Citations
                    </label>
                  </div>
                </div>
              </div>
              
              <Button
                variant="primary"
                size="md"
                className="w-full mt-6 flex items-center justify-center"
                onClick={handleSavePreferences}
              >
                <Save size={16} className="mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 