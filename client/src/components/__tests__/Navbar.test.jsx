import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

test('renders navbar with Contact Us CTA', () => {
  render(<Navbar />);
  const ctaElement = screen.getByText(/Contact Us/i);
  expect(ctaElement).toBeInTheDocument();
  expect(ctaElement.getAttribute('href')).toBe('#contact');
});