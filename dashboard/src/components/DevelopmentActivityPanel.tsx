import {
    Clock,
    Code,
    FileText,
    Folder,
    Search,
    TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Activity } from '../types';

interface DevelopmentActivityPanelProps {
  activities: Activity[] | undefined;
}

interface DevelopmentActivity extends Activity {
  fileName?: string;
  fileExtension?: string;
  language?: string;
  projectPath?: string;
  editor?: string;
}

const DevelopmentActivityPanel: React.FC<DevelopmentActivityPanelProps> = ({ 
  activities = []
}) => {
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterEditor, setFilterEditor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const developmentActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities
      .filter(activity => 
        activity.category?.toLowerCase().includes('development') ||
        activity.app_name?.toLowerCase().includes('code') ||
        activity.app_name?.toLowerCase().includes('cursor') ||
        activity.app_name?.toLowerCase().includes('vim') ||
        activity.app_name?.toLowerCase().includes('sublime') ||
        activity.app_name?.toLowerCase().includes('atom') ||
        activity.app_name?.toLowerCase().includes('jetbrains')
      )
      .map(activity => {
        // Extract file information from window title
        const title = activity.window_title || '';
        const fileMatch = title.match(/([^/\\]+\.\w+)/);
        const fileName = fileMatch ? fileMatch[1] : null;
        const extensionMatch = fileName?.match(/\.(\w+)$/);
        const fileExtension = extensionMatch ? extensionMatch[1] : null;
        
        // Map extensions to languages
        const languageMap: { [key: string]: string } = {
          js: 'JavaScript',
          ts: 'TypeScript',
          tsx: 'TypeScript',
          jsx: 'JavaScript',
          py: 'Python',
          go: 'Go',
          rs: 'Rust',
          java: 'Java',
          cpp: 'C++',
          c: 'C',
          cs: 'C#',
          php: 'PHP',
          rb: 'Ruby',
          swift: 'Swift',
          kt: 'Kotlin',
          scala: 'Scala',
          html: 'HTML',
          css: 'CSS',
          scss: 'SCSS',
          sass: 'SASS',
          vue: 'Vue',
          svelte: 'Svelte',
          md: 'Markdown',
          json: 'JSON',
          yaml: 'YAML',
          yml: 'YAML',
          xml: 'XML',
          sql: 'SQL',
          sh: 'Shell',
          bash: 'Bash',
          zsh: 'Zsh',
          ps1: 'PowerShell',
          dockerfile: 'Docker',
        };
        
        const language = fileExtension ? languageMap[fileExtension.toLowerCase()] || fileExtension.toUpperCase() : 'Unknown';
        
        // Extract project path
        const pathMatch = title.match(/([^/\\]+)(?:[/\\]|$)/);
        const projectPath = pathMatch ? pathMatch[1] : null;
        
        // Determine editor
        const editor = activity.app_name?.toLowerCase().includes('cursor') ? 'Cursor' :
                      activity.app_name?.toLowerCase().includes('code') ? 'VS Code' :
                      activity.app_name || 'Unknown';
        
        return {
          ...activity,
          fileName,
          fileExtension,
          language,
          projectPath,
          editor
        } as DevelopmentActivity;
      })
      .filter(activity => {
        if (filterLanguage !== 'all' && activity.language !== filterLanguage) return false;
        if (filterEditor !== 'all' && activity.editor !== filterEditor) return false;
        if (searchTerm && !activity.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !activity.projectPath?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      });
  }, [activities, filterLanguage, filterEditor, searchTerm]);

  const languageStats = useMemo(() => {
    const languages: { [key: string]: { count: number; totalTime: number; files: Set<string> } } = {};
    
    developmentActivities.forEach(activity => {
      const lang = activity.language || 'Unknown';
      if (!languages[lang]) {
        languages[lang] = { count: 0, totalTime: 0, files: new Set() };
      }
      languages[lang].count++;
      languages[lang].totalTime += activity.focus_duration;
      if (activity.fileName) {
        languages[lang].files.add(activity.fileName);
      }
    });
    
    return Object.entries(languages)
      .map(([language, stats]) => ({ 
        language, 
        ...stats, 
        uniqueFiles: stats.files.size 
      }))
      .sort((a, b) => b.totalTime - a.totalTime);
  }, [developmentActivities]);

  const projectStats = useMemo(() => {
    const projects: { [key: string]: { count: number; totalTime: number; languages: Set<string> } } = {};
    
    developmentActivities.forEach(activity => {
      const project = activity.projectPath || 'Unknown';
      if (!projects[project]) {
        projects[project] = { count: 0, totalTime: 0, languages: new Set() };
      }
      projects[project].count++;
      projects[project].totalTime += activity.focus_duration;
      if (activity.language) {
        projects[project].languages.add(activity.language);
      }
    });
    
    return Object.entries(projects)
      .map(([project, stats]) => ({ 
        project, 
        ...stats, 
        languageCount: stats.languages.size 
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);
  }, [developmentActivities]);

  const editorStats = useMemo(() => {
    const editors: { [key: string]: { count: number; totalTime: number } } = {};
    
    developmentActivities.forEach(activity => {
      const editor = activity.editor || 'Unknown';
      if (!editors[editor]) {
        editors[editor] = { count: 0, totalTime: 0 };
      }
      editors[editor].count++;
      editors[editor].totalTime += activity.focus_duration;
    });
    
    return Object.entries(editors).map(([editor, stats]) => ({ editor, ...stats }));
  }, [developmentActivities]);

  const getLanguageIcon = (language: string) => {
    const iconMap: { [key: string]: string } = {
      'JavaScript': '📄',
      'TypeScript': '📘',
      'Python': '🐍',
      'Go': '🔵',
      'Rust': '🦀',
      'Java': '☕',
      'C++': '⚡',
      'C': '🔧',
      'HTML': '🌐',
      'CSS': '🎨',
      'Markdown': '📝',
      'JSON': '📋',
    };
    return iconMap[language] || '📄';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalDevelopmentTime = developmentActivities.reduce((sum, activity) => sum + activity.focus_duration, 0);
  const uniqueFiles = new Set(developmentActivities.map(a => a.fileName).filter(Boolean)).size;
  const uniqueLanguages = languageStats.length;

  const availableLanguages = [...new Set(developmentActivities.map(a => a.language).filter(Boolean))].sort();
  const availableEditors = [...new Set(developmentActivities.map(a => a.editor).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Code className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Development Activity</h2>
              <p className="text-gray-600">File switches, coding time, and project insights</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{developmentActivities.length}</p>
            <p className="text-sm text-gray-600">File Switches</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDevelopmentTime)}</p>
            <p className="text-sm text-gray-600">Coding Time</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Code className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{uniqueFiles}</p>
            <p className="text-sm text-gray-600">Unique Files</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{uniqueLanguages}</p>
            <p className="text-sm text-gray-600">Languages</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Language Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
          <div className="space-y-3">
            {languageStats.slice(0, 8).map(({ language, totalTime, uniqueFiles }) => (
              <div key={language} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getLanguageIcon(language)}</span>
                  <div>
                    <span className="font-medium">{language}</span>
                    <p className="text-xs text-gray-500">{uniqueFiles} files</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration(totalTime)}</p>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (totalTime / languageStats[0]?.totalTime || 1) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Editors</h3>
          <div className="space-y-3">
            {editorStats.map(({ editor, count, totalTime }) => (
              <div key={editor} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  <div>
                    <span className="font-medium">{editor}</span>
                    <p className="text-xs text-gray-500">{count} switches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration(totalTime)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
          <div className="space-y-3">
            {projectStats.slice(0, 6).map(({ project, totalTime, languageCount }) => (
              <div key={project} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <div>
                    <span className="font-medium truncate">{project}</span>
                    <p className="text-xs text-gray-500">{languageCount} languages</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration(totalTime)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Development Activity</h3>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Language Filter */}
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Languages</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              {/* Editor Filter */}
              <select
                value={filterEditor}
                onChange={(e) => setFilterEditor(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Editors</option>
                {availableEditors.map(editor => (
                  <option key={editor} value={editor}>{editor}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {developmentActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No development activities found. Install the VS Code extension to start tracking!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {developmentActivities.slice(0, 20).map((activity, index) => (
                <div key={`${activity.timestamp}-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-lg">{getLanguageIcon(activity.language || 'Unknown')}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full font-medium">
                            File Switch
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(activity.focus_duration)}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mt-1">{activity.fileName || 'Unknown File'}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-purple-600">{activity.language}</span>
                        <span className="text-sm text-gray-500">{activity.editor}</span>
                        {activity.projectPath && (
                          <span className="text-sm text-gray-500">{activity.projectPath}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevelopmentActivityPanel;
