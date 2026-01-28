import React from 'react';

const ShapeMaskIcon = props => (
    <svg
        {...props}
        width="20px"
        height="20px"
        viewBox="0 0 20 20"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
    >
        <title>mask</title>
        <desc>Created with Sketch.</desc>
        <defs />
        <mask id="myMask">
            <rect
                x="0"
                y="0"
                width="20"
                height="20"
                fill="black"
            />

            <g
                id="copy"
                transform="translate(0.000000, 0.000000)"
            >
                <g transform="translate(1.000000, 1.000000) scale(0.9)">
                    <rect
                        x="2.6"
                        y="7.75"
                        width="8.5"
                        height="8.5"
                        rx="1"
                        fill="white"
                    />
                </g>
            </g>
        </mask>
        <g
            id="Page-1"
            stroke="none"
            strokeWidth="1"
            fill="none"
            fillRule="evenodd"
        >
            <g id="copy-v2">
                <g
                    id="copy"
                    transform="translate(0.000000, 0.000000)"
                >
                    <circle
                        cx="10"
                        cy="10"
                        r="10"
                        fill="currentColor"
                        style={{color: 'var(--paint-looks-secondary-default, #FF8C1A)'}}
                    />
                    <g
                        id="copy"
                        transform="translate(1.000000, 1.000000) scale(0.9)"
                    >
                        <rect
                            x="2.5"
                            y="8"
                            width="8.5"
                            height="8.5"
                            rx="1"
                            fill="#ffffff80"
                        />
                        <circle
                            cx="12.5"
                            cy="7.5"
                            r="5"
                            fill="currentColor"
                            style={{color: 'var(--paint-looks-secondary-default, #FF8C1A)'}}
                        />
                        <circle
                            cx="12.5"
                            cy="7.5"
                            r="5"
                            fill="#ffffff80"
                        />
                        <circle
                            cx="12.5"
                            cy="7.5"
                            r="5"
                            fill="white"
                            mask="url(#myMask)"
                        />
                    </g>
                </g>
            </g>
        </g>
    </svg>);

export default ShapeMaskIcon;
