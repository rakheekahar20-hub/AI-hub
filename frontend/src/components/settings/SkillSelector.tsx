import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, Plus, X, Sparkles, ChevronDown } from 'lucide-react';

export const ROLE_SKILL_MAP: Record<string, string[]> = {
  'Frontend Developer': [
    'React',
    'Vue',
    'Tailwind CSS',
    'Next.js',
    'HTML/CSS',
    'TypeScript',
    'UI Components',
    'Vite',
    'Redux',
    'Zustand',
    'JavaScript',
    'CSS Modules',
    'Sass',
    'Responsive Design',
    'Accessibility (a11y)',
    'Webpack'
  ],
  'Backend Developer': [
    'Node.js',
    'Express',
    'Python/Django',
    'PostgreSQL',
    'MongoDB',
    'GraphQL',
    'REST API',
    'FastAPI',
    'Prisma',
    'Docker',
    'Redis',
    'SQL',
    'NestJS',
    'Microservices',
    'Authentication/JWT',
    'TypeORM'
  ],
  'Full Stack Developer': [
    'React',
    'Node.js',
    'TypeScript',
    'Next.js',
    'Express',
    'Tailwind CSS',
    'PostgreSQL',
    'MongoDB',
    'REST API',
    'GraphQL',
    'Prisma',
    'Docker',
    'HTML/CSS',
    'UI Components',
    'FastAPI',
    'Python/Django',
    'Redis'
  ],
  'QA Engineer': [
    'Playwright',
    'Jest',
    'Cypress',
    'Selenium',
    'Vitest',
    'Unit Testing',
    'E2E Testing',
    'Integration Testing',
    'API Testing',
    'Postman',
    'Test Automation',
    'Supertest'
  ],
  'Mobile App Developer': [
    'React Native',
    'Expo',
    'Flutter',
    'Dart',
    'iOS (Swift)',
    'Android (Kotlin)',
    'Mobile UI',
    'Capacitor',
    'Cordova',
    'State Management'
  ],
  'AI / ML Engineer': [
    'Python',
    'FastAPI',
    'PyTorch',
    'TensorFlow',
    'OpenAI API',
    'Gemini API',
    'LangChain',
    'Hugging Face',
    'Model Context Protocol (MCP)',
    'Pandas',
    'NumPy',
    'Vector DB',
    'Prompt Engineering'
  ]
};

const ALL_COMMON_SKILLS: string[] = Array.from(
  new Set([
    ...Object.values(ROLE_SKILL_MAP).flat(),
    'Git',
    'GitHub Actions',
    'CI/CD',
    'AWS',
    'Linux',
    'Turborepo',
    'Vercel',
    'Kubernetes',
    'Bash/Shell',
    'Socket.io',
    'WebSockets'
  ])
);

export interface SkillSelectorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  currentRole?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  skills,
  onChange,
  currentRole = 'Full Stack Developer',
  label = 'Add Skills / Tech Stack',
  placeholder = 'Type to search or add skills (e.g. React, Node.js)...',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine normalized role key
  const matchedRoleKey = useMemo(() => {
    if (!currentRole) return 'Full Stack Developer';
    const lower = currentRole.toLowerCase();
    if (lower.includes('frontend')) return 'Frontend Developer';
    if (lower.includes('backend')) return 'Backend Developer';
    if (lower.includes('qa') || lower.includes('test')) return 'QA Engineer';
    if (lower.includes('mobile')) return 'Mobile App Developer';
    if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine')) return 'AI / ML Engineer';
    if (lower.includes('full') || lower.includes('stack')) return 'Full Stack Developer';
    return Object.keys(ROLE_SKILL_MAP).find(k => k.toLowerCase() === lower) || 'Full Stack Developer';
  }, [currentRole]);

  // Role-specific primary skills
  const roleSkills = useMemo(() => {
    return ROLE_SKILL_MAP[matchedRoleKey] || ROLE_SKILL_MAP['Full Stack Developer'];
  }, [matchedRoleKey]);

  // Compute prioritized suggestions based on current role and input query
  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const existingSet = new Set(skills.map(s => s.toLowerCase()));

    // Collect all available candidates prioritizing current role skills
    const orderedCandidates: { name: string; isRoleSpecific: boolean }[] = [];
    const seen = new Set<string>();

    for (const skill of roleSkills) {
      if (!seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase());
        orderedCandidates.push({ name: skill, isRoleSpecific: true });
      }
    }

    for (const skill of ALL_COMMON_SKILLS) {
      if (!seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase());
        orderedCandidates.push({ name: skill, isRoleSpecific: false });
      }
    }

    if (!query) {
      // Show unselected role-specific skills first, then top common skills (up to 12 items)
      return orderedCandidates
        .filter(c => !existingSet.has(c.name.toLowerCase()))
        .slice(0, 10);
    }

    // Filter matching candidates
    const startsWithMatches: { name: string; isRoleSpecific: boolean }[] = [];
    const containsMatches: { name: string; isRoleSpecific: boolean }[] = [];

    for (const c of orderedCandidates) {
      if (existingSet.has(c.name.toLowerCase())) continue;
      const lowerName = c.name.toLowerCase();
      if (lowerName === query) {
        startsWithMatches.unshift(c);
      } else if (lowerName.startsWith(query)) {
        startsWithMatches.push(c);
      } else if (lowerName.includes(query)) {
        containsMatches.push(c);
      }
    }

    const filtered = [...startsWithMatches, ...containsMatches].slice(0, 10);

    // If query does not exactly match any existing candidate, provide custom add option
    const exactMatch = orderedCandidates.some(c => c.name.toLowerCase() === query);
    if (!exactMatch && query.length > 0 && !existingSet.has(query)) {
      filtered.push({
        name: inputValue.trim(),
        isRoleSpecific: false
      });
    }

    return filtered;
  }, [inputValue, skills, roleSkills]);

  // Quick recommendation pills (unselected top role skills)
  const quickRecommendations = useMemo(() => {
    const existingSet = new Set(skills.map(s => s.toLowerCase()));
    return roleSkills.filter(s => !existingSet.has(s.toLowerCase())).slice(0, 6);
  }, [roleSkills, skills]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    const exists = skills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...skills, trimmed]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(s => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && suggestions.length > 0 && highlightedIndex < suggestions.length) {
        addSkill(suggestions[highlightedIndex].name);
      } else if (inputValue.trim()) {
        addSkill(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-400" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-normal">
            (Filtered for <span className="text-blue-400 font-semibold">{matchedRoleKey}</span>)
          </span>
        </label>
        {skills.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear all ({skills.length})
          </button>
        )}
      </div>

      {/* Selected Skill Badges */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#10161f] border border-[#232e3d] rounded-xl max-h-28 overflow-y-auto">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/15 border border-blue-500/30 text-blue-300 transition-all hover:bg-blue-600/25 group"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(skill);
                }}
                className="text-blue-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-full p-0.5 transition-colors"
                title={`Remove ${skill}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Autocomplete Input */}
      <div className="relative">
        <div className="flex items-center bg-[#161d27] border border-[#232e3d] focus-within:border-blue-500 rounded-xl overflow-hidden transition-all shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3.5 py-2 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (inputValue.trim()) {
                addSkill(inputValue.trim());
              } else {
                setIsOpen(!isOpen);
              }
            }}
            className="px-3 py-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 transition-colors flex items-center gap-1 text-xs"
          >
            {inputValue.trim() ? (
              <>
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-semibold text-blue-400">Add</span>
              </>
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#161f2c] border border-[#2b394a] rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5 border-b border-[#232e3d] bg-[#121822] flex items-center justify-between text-[10px] text-slate-400 px-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Suggested for {matchedRoleKey}
              </span>
              <span>Press Enter or click to add</span>
            </div>
            <div className="p-1 space-y-0.5">
              {suggestions.map((item, index) => {
                const isSelected = index === highlightedIndex;
                return (
                  <button
                    key={`${item.name}-${index}`}
                    type="button"
                    onClick={() => addSkill(item.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-600/30 text-white font-medium'
                        : 'text-slate-300 hover:bg-[#202b3b]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.isRoleSpecific && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                          Role Match
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.name.toLowerCase() === inputValue.trim().toLowerCase() ? '+ Add Custom' : '+ Add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Recommendations */}
      {quickRecommendations.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Recommended for {matchedRoleKey}:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {quickRecommendations.map((rec) => (
              <button
                key={rec}
                type="button"
                onClick={() => addSkill(rec)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-blue-600/20 border border-slate-700/60 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{rec}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
