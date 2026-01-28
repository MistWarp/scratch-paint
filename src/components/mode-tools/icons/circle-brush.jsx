import React from 'react';

const CircleBrush = props => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
    >
        <rect
            fill="currentColor"
            width="15"
            height="15"
            rx="100"
            transform="translate(2.5 2.5)"
            style={{color: 'var(--paint-looks-secondary-default, #FF8C1A)'}}
        />
    </svg>
);

export default CircleBrush;
