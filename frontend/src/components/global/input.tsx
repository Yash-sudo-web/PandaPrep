import React, { useEffect, useState } from "react";

type AnimatedInputProps = {
  formDataValue: string;
  handleInputChange: (field: string, value: string) => void;
  fieldKey: string;
  placeholders: string[];
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  formDataValue,
  handleInputChange,
  fieldKey,
  placeholders,
  className = "",
  inputProps = {},
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderOpacity(0);

      setTimeout(() => {
        const nextIndex = (currentPlaceholderIndex + 1) % placeholders.length;
        setCurrentPlaceholderIndex(nextIndex);
        setCurrentPlaceholder(placeholders[nextIndex]);
        setPlaceholderOpacity(1);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPlaceholderIndex, placeholders]);

  return (
    <div className="relative">
      <input
        type="text"
        value={formDataValue}
        onChange={(e) => handleInputChange(fieldKey, e.target.value)}
        className={`w-[35rem] px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
        style={{ transition: "all 0.3s ease" }}
        {...inputProps}
      />
      {!formDataValue && (
        <div
          className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-400"
          style={{
            opacity: placeholderOpacity,
            transition: "opacity 0.5s ease",
          }}
        >
          {currentPlaceholder}
        </div>
      )}
    </div>
  );
};

export default AnimatedInput;
