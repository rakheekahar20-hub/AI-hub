import { render, screen } from '@testing-library/react';
import GitHubConnect from '../components/GitHubConnect';

test('renders connect button', () => {
  render(<GitHubConnect />);
  expect(screen.getByText(/Connect with GitHub/i)).toBeInTheDocument();
});