import { render, screen } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

vi.mock('./utils/api.js', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({
      totalUsers: 10,
      totalWorkers: 5,
      totalBookings: 20,
      bookingsByStatus: []
    }))
  }
}));

describe('Admin Panel App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows login page when user is not logged in', async () => {
    render(<App />);
    const heading = await screen.findByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Admin Portal');
  });

  it('allows access if user is admin', async () => {
    // We can just rely on the fallback AdminGuard behavior,
    // intercept useAuth to return a fake user directly.
    vi.mock('./context/AuthContext.jsx', async (importOriginal) => {
      const actual = await importOriginal()
      return {
        ...actual,
        useAuth: () => ({ user: { role: 'ADMIN', name: 'Test' }, isLoading: false })
      }
    })
    
    render(<App />);
    const signInButton = screen.queryByRole('button', { name: /Secure Sign In/i });
    expect(signInButton).not.toBeInTheDocument();
  });
});
