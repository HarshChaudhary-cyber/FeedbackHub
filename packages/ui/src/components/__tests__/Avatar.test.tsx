/** @vitest-environment jsdom */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { Avatar } from '../Avatar';

afterEach(() => {
  cleanup();
});

describe('Avatar Primitive', () => {
  it('renders image when valid src is provided', () => {
    render(
      <Avatar
        src="https://images.unsplash.com/photo-user.jpg"
        alt="Sarah Connor"
        data-testid="avatar"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeTruthy();
    expect(image.getAttribute('src')).toBe('https://images.unsplash.com/photo-user.jpg');
    expect(image.getAttribute('alt')).toBe('Sarah Connor');
  });

  it('renders fallback initials from user name when no src is supplied', () => {
    const { rerender } = render(<Avatar name="Sarah Connor" />);
    expect(screen.getByText('SC')).toBeTruthy();

    rerender(<Avatar name="Harsh" />);
    expect(screen.getByText('HA')).toBeTruthy();

    rerender(<Avatar fallback="FH" />);
    expect(screen.getByText('FH')).toBeTruthy();
  });

  it('switches gracefully to fallback initials when image fails to load (onError)', () => {
    render(
      <Avatar
        src="https://broken-image-link.invalid/photo.png"
        name="Alex Morgan"
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeTruthy();

    // Trigger image loading failure
    fireEvent.error(image);

    // Image element is removed and replaced by fallback initials 'AM'
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('AM')).toBeTruthy();
  });

  it('renders status indicator with correct aria-label and styling', () => {
    render(<Avatar name="John Doe" status="online" data-testid="avatar-status" />);

    const statusDot = screen.getByLabelText('Status: online');
    expect(statusDot).toBeTruthy();
    expect(statusDot.className).toContain('bg-emerald-500');
  });

  it('renders small, medium and large size options', () => {
    const { rerender } = render(<Avatar name="John Doe" size="sm" data-testid="avatar" />);
    let avatar = screen.getByTestId('avatar');
    expect(avatar.className).toContain('w-8');
    expect(avatar.className).toContain('h-8');

    rerender(<Avatar name="John Doe" size="lg" data-testid="avatar" />);
    avatar = screen.getByTestId('avatar');
    expect(avatar.className).toContain('w-12');
    expect(avatar.className).toContain('h-12');
  });

  it('forwards ref properly to HTMLDivElement', () => {
    const avatarRef = React.createRef<HTMLDivElement>();
    render(<Avatar name="Ref Avatar" ref={avatarRef} />);
    expect(avatarRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
