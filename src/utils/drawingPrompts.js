export const DRAWING_PROMPTS = [
  {
    id: 'energy',
    title: 'Energy Circle',
    instruction: 'Fill this circle with lines and colors that show your energy right now.',
    description: 'How much energy do you have? What does it look like?',
    icon: '⚡',
    color: '#F59E0B',
    colorLight: '#FEF3C7',
    bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    hasTemplate: true,
    templateType: 'circle',
    clinical: 'Energy assessment, fatigue/agitation indicators',
  },
  {
    id: 'body',
    title: 'Body Map',
    instruction: 'Shade where your body feels heavy, tight, or uncomfortable.',
    description: 'Show us where you carry tension or pain.',
    icon: '🫂',
    color: '#EC4899',
    colorLight: '#FCE7F3',
    bgGradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
    hasTemplate: true,
    templateType: 'body',
    clinical: 'Somatic symptom mapping, pain localization',
  },
  {
    id: 'weather',
    title: 'Day Weather',
    instruction: 'Draw today as weather. Stormy? Sunny? Cloudy? Add people if you want.',
    description: 'What does today feel like as weather?',
    icon: '🌤️',
    color: '#3B82F6',
    colorLight: '#DBEAFE',
    bgGradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    hasTemplate: false,
    clinical: 'Mood assessment, environmental perception',
  },
  {
    id: 'safe',
    title: 'Safe Thing',
    instruction: 'Draw something that makes you feel calm, safe, or happy.',
    description: 'What brings you comfort?',
    icon: '🛡️',
    color: '#10B981',
    colorLight: '#D1FAE5',
    bgGradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    hasTemplate: false,
    clinical: 'Coping resources, attachment indicators',
  },
  {
    id: 'worry',
    title: 'Worry Shape',
    instruction: 'Draw your worry, fear, or hard feeling as a monster or shape.',
    description: 'Give your difficult feelings a form.',
    icon: '👾',
    color: '#8B5CF6',
    colorLight: '#EDE9FE',
    bgGradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    hasTemplate: false,
    clinical: 'Anxiety externalization, fear assessment',
  },
];

export const WEEKLY_GOAL = 15;
export const WEEKS_TOTAL = 4;

export function getPromptById(id) {
  return DRAWING_PROMPTS.find(p => p.id === id);
}
