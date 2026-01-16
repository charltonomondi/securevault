// Security utilities for document protection

export const disableContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  return false;
};

export const disableKeyboardShortcuts = (e: KeyboardEvent) => {
  // Block common shortcuts
  const blockedKeys = [
    { key: 'c', ctrl: true },   // Copy
    { key: 'x', ctrl: true },   // Cut
    { key: 'v', ctrl: true },   // Paste
    { key: 's', ctrl: true },   // Save
    { key: 'p', ctrl: true },   // Print
    { key: 'a', ctrl: true },   // Select All
    { key: 'u', ctrl: true },   // View Source
    { key: 'PrintScreen', ctrl: false }, // Print Screen
    { key: 'F12', ctrl: false }, // Dev Tools
    { key: 'i', ctrl: true, shift: true }, // Dev Tools
    { key: 'j', ctrl: true, shift: true }, // Console
  ];

  const isBlocked = blockedKeys.some(blocked => {
    const keyMatch = e.key.toLowerCase() === blocked.key.toLowerCase();
    const ctrlMatch = blocked.ctrl ? (e.ctrlKey || e.metaKey) : true;
    const shiftMatch = blocked.shift ? e.shiftKey : true;
    return keyMatch && ctrlMatch && shiftMatch;
  });

  if (isBlocked || e.key === 'PrintScreen') {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
};

export const disableDragStart = (e: DragEvent) => {
  e.preventDefault();
  return false;
};

export const disableSelection = () => {
  document.getSelection()?.removeAllRanges();
};

// Attach all security event listeners
export const attachSecurityListeners = () => {
  document.addEventListener('contextmenu', disableContextMenu);
  document.addEventListener('keydown', disableKeyboardShortcuts);
  document.addEventListener('dragstart', disableDragStart);
  document.addEventListener('selectstart', disableSelection);
  
  // Block printing via CSS
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body * {
        display: none !important;
      }
      body::after {
        content: "Printing is disabled for security reasons.";
        display: block;
        font-size: 24px;
        text-align: center;
        padding: 100px;
      }
    }
  `;
  document.head.appendChild(style);

  return () => {
    document.removeEventListener('contextmenu', disableContextMenu);
    document.removeEventListener('keydown', disableKeyboardShortcuts);
    document.removeEventListener('dragstart', disableDragStart);
    document.removeEventListener('selectstart', disableSelection);
    document.head.removeChild(style);
  };
};

// Generate watermark positions across the document
export const generateWatermarkPositions = (containerWidth: number, containerHeight: number) => {
  const positions: { x: number; y: number; key: string }[] = [];
  const spacing = 250;
  
  for (let y = 50; y < containerHeight; y += spacing) {
    for (let x = 50; x < containerWidth; x += spacing) {
      positions.push({
        x: x + (Math.random() * 30 - 15),
        y: y + (Math.random() * 30 - 15),
        key: `${x}-${y}`
      });
    }
  }
  
  return positions;
};
