import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '../Navbar';

describe('Navbar Component', () => {
  it('renders the clinical cyan-blue medical badge and action button', () => {
    render(<Navbar />);
    
    const badge = screen.getByText('HPlus');
    expect(badge).toHaveClass('bg-sky-600');
    
    const button = screen.getByText('Book a visit');
    expect(button).toHaveClass('bg-sky-600');
    expect(button).toHaveClass('hover:bg-sky-700');
  });
});