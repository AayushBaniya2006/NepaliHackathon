import { Router } from 'express';

const router = Router();

const MOCK_RESOURCES = [
  { name: '988 Suicide & Crisis Lifeline', type: 'crisis_line', phone: '988', cost: 'Free', hours: '24/7', description: 'Free, confidential support for people in distress.', website: 'https://988lifeline.org' },
  { name: 'Crisis Text Line', type: 'crisis_line', phone: 'Text HOME to 741741', cost: 'Free', hours: '24/7', description: 'Free crisis counseling via text message.' },
  { name: 'SAMHSA National Helpline', type: 'crisis_line', phone: '1-800-273-8255', cost: 'Free', hours: '24/7', description: 'Treatment referrals and information.' },
  { name: 'Open Path Collective', type: 'telehealth', phone: null, cost: '$30-80/session', hours: 'Varies', description: 'Affordable online therapy with licensed therapists.', website: 'https://openpathcollective.org' },
  { name: 'NAMI HelpLine', type: 'support_group', phone: '1-800-950-6264', cost: 'Free', hours: 'M-F 10am-10pm ET', description: 'Information, referrals, and support for mental health conditions.' },
];

router.get('/', (req, res) => {
  res.json(MOCK_RESOURCES);
});

export default router;
