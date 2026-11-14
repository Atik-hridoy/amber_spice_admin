import { ADMIN_API_BASE_URL } from '../../services/endpoints'
import type { ApiPreset } from '../../types/api-tester'
import { MENU_PRESETS } from './menu-presets'

export const API_PRESETS: ApiPreset[] = [
  ...MENU_PRESETS,
  { id: 'auth-login', name: 'Sign in', category: 'Authentication', method: 'POST',
    url: `${ADMIN_API_BASE_URL}/auth/login/`, auth: 'none',
    description: 'Enter account credentials. The response access token becomes available in Manual bearer mode.',
    body: JSON.stringify({ email: '', password: '' }, null, 2),
  },
  { id: 'auth-me', name: 'Current user and permissions', category: 'Authentication', method: 'GET',
    url: `${ADMIN_API_BASE_URL}/auth/me/`, description: 'Inspect the current account and effective permissions.',
  },
]
