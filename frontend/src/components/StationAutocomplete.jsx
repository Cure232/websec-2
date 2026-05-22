import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function StationAutocomplete({
  placeholder,
  value,
  suggestions,
  loading,
  onInputChange,
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const updateDropdownPosition = () => {
    if (!inputRef.current) return; 
    
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'absolute',
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      zIndex: 9999,
      boxSizing: 'border-box',
    });
  };

  const openDropdown = () => {
    updateDropdownPosition();
    setIsOpen(true);
  };

  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    const resizeObserver = new ResizeObserver(handleUpdate);
    if (inputRef.current) resizeObserver.observe(inputRef.current);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        !document.querySelector('.autocomplete-dropdown')?.contains(e.target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange(newValue);
    openDropdown();
  };

  const handleSelect = (station) => {
    onSelect(station);
    closeDropdown();
    inputRef.current?.blur();
  };

  const renderDropDown = () => {
    if (loading) {
      return <div className="autocomplete-loading-item">Поиск…</div>;
    }

    if (suggestions.length === 0 && value.trim() !== '') {
      return <div className="autocomplete-empty-item">Ничего не найдено</div>;
    }

    if (suggestions.length === 0) {
      return null;
    }

    return suggestions.map((station, idx) => (
      <button
        key={station.code || idx}
        type="button"
        className="autocomplete-item"
        onClick={() => handleSelect(station)}
      >
        {station.displayTitle || station.title}
      </button>
    ));
  };

  const dropdownContent = renderDropDown();

  return (
    <div className="autocomplete" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if ((suggestions.length > 0 || loading) && !isOpen) {
            openDropdown();
          }
        }}
        autoComplete="off"
      />
      {isOpen && dropdownContent && createPortal(
        <div
          className="autocomplete-dropdown"
          style={dropdownStyle}
          onMouseDown={(e) => e.preventDefault()}
        >
          {dropdownContent}
        </div>,
        document.body
      )}
    </div>
  );
}
