import React from 'react';

/**
 * BotanicalArtwork
 *
 * High-resolution botanical background composition for the To Be Take branding panel.
 * Features layered tropical monstera leaves, arching palm fronds, and delicate gold/forest green
 * venation that anchors naturally to the bottom-left of the panel behind text content.
 */
export function BotanicalArtwork(): React.ReactElement {
  return (
    <div className="auth-sidebar-bg-artwork" aria-hidden="true">
      <svg
        viewBox="0 0 480 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMax meet"
      >
        <defs>
          {/* Ambient Lighting */}
          <radialGradient id="ambientGlow" cx="25%" cy="85%" r="65%">
            <stop offset="0%" stopColor="#245d3e" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#14291f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0d1e15" stopOpacity="0" />
          </radialGradient>

          {/* Deep Monstera Gradient */}
          <linearGradient id="monsteraDeepGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#286343" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#19482f" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0a1d12" stopOpacity="0.3" />
          </linearGradient>

          {/* Secondary Monstera Gradient */}
          <linearGradient id="monsteraSecGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#357a53" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#1e5236" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0d2417" stopOpacity="0.25" />
          </linearGradient>

          {/* Palm Frond Leaflet Gradient */}
          <linearGradient id="palmFrondGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#173e28" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#2b6b47" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#4a9c6c" stopOpacity="0.4" />
          </linearGradient>

          {/* Gold Accent Vein Gradient */}
          <linearGradient id="goldVeinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a34b" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#e5b758" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#d4a34b" stopOpacity="0.1" />
          </linearGradient>

          {/* Subtle Green Vein Gradient */}
          <linearGradient id="greenVeinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52a775" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1b422b" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <ellipse cx="140" cy="360" rx="260" ry="180" fill="url(#ambientGlow)" />

        {/* ==================== LAYER 1: Deep Background Monstera (Left) ==================== */}
        <g opacity="0.65" transform="rotate(-8 120 280)">
          {/* Main Leaf Body with deep lobes */}
          <path
            d="M 60 410 C 20 330 10 240 70 170 C 120 110 210 130 250 180 C 285 225 290 310 240 370 C 190 430 100 440 60 410 Z"
            fill="url(#monsteraDeepGrad)"
          />
          {/* Midrib Stem */}
          <path
            d="M 50 430 Q 120 310 210 160"
            stroke="url(#goldVeinGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Lateral Veins */}
          <path
            d="M 100 340 Q 60 300 25 310"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 125 300 Q 80 250 45 235"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 155 250 Q 120 200 95 175"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 130 315 Q 180 320 240 345"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 160 265 Q 215 260 260 270"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M 185 210 Q 230 195 245 180"
            stroke="url(#greenVeinGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Monstera Cutouts / Fenestrations */}
          <path
            d="M 90 285 C 80 270 95 255 110 270 C 105 285 95 290 90 285 Z"
            fill="#0d1e15"
            opacity="0.85"
          />
          <path
            d="M 125 240 C 118 225 132 215 142 228 C 138 240 130 245 125 240 Z"
            fill="#0d1e15"
            opacity="0.85"
          />
          <path
            d="M 155 300 C 170 305 180 320 165 325 C 152 320 150 305 155 300 Z"
            fill="#0d1e15"
            opacity="0.85"
          />
          <path
            d="M 180 250 C 195 252 205 265 192 272 C 180 268 175 255 180 250 Z"
            fill="#0d1e15"
            opacity="0.85"
          />
        </g>

        {/* ==================== LAYER 2: Sweeping Palm Frond (Center to Right) ==================== */}
        <g opacity="0.75">
          {/* Central arching palm rachis/stem */}
          <path
            d="M 20 440 C 80 390 190 320 380 220"
            stroke="url(#goldVeinGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Upper arching pinnae/leaflets */}
          <path
            d="M 80 380 C 85 320 120 270 170 240 C 135 275 110 325 105 370 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 125 350 C 140 285 190 230 250 195 C 205 235 170 290 155 338 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 175 315 C 205 250 265 195 330 160 C 275 205 230 260 210 302 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 230 280 C 270 220 335 170 410 135 C 345 180 295 230 270 268 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 290 250 C 335 190 405 150 470 120 C 410 160 360 205 330 238 Z"
            fill="url(#palmFrondGrad)"
          />

          {/* Lower drooping pinnae/leaflets */}
          <path
            d="M 110 390 C 120 420 150 445 190 455 C 160 440 140 415 130 385 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 160 360 C 185 400 230 425 285 430 C 240 415 205 385 185 350 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 220 325 C 260 370 315 390 375 390 C 325 375 280 345 250 312 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 285 285 C 335 325 395 340 455 335 C 400 325 355 295 320 272 Z"
            fill="url(#palmFrondGrad)"
          />
          <path
            d="M 345 245 C 390 280 445 290 495 280 C 445 275 405 255 375 235 Z"
            fill="url(#palmFrondGrad)"
          />
        </g>

        {/* ==================== LAYER 3: Foreground Monstera Deliciosa (Bottom Left) ==================== */}
        <g opacity="0.88">
          {/* Main Leaf Silhouette with Organic Notches */}
          <path
            d="M 10 430 C 5 360 35 290 95 240 C 155 190 240 205 280 255 C 320 305 305 380 250 425 C 190 470 80 470 10 430 Z"
            fill="url(#monsteraSecGrad)"
          />

          {/* Glowing Gold Main Rib */}
          <path
            d="M 0 450 Q 100 370 205 240"
            stroke="url(#goldVeinGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Detailed Veins with Gold & Emerald Transitions */}
          <path
            d="M 45 395 Q 15 345 0 350"
            stroke="url(#goldVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 75 360 Q 35 305 10 290"
            stroke="url(#goldVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 115 315 Q 75 255 45 230"
            stroke="url(#goldVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 155 270 Q 125 215 100 190"
            stroke="url(#goldVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M 85 375 Q 140 385 200 415"
            stroke="url(#greenVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 120 330 Q 185 330 245 350"
            stroke="url(#greenVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 155 285 Q 220 275 270 280"
            stroke="url(#greenVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 185 245 Q 235 225 255 210"
            stroke="url(#greenVeinGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Deep Organic Cutouts / Fenestrations */}
          <ellipse
            cx="65"
            cy="325"
            rx="14"
            ry="6"
            transform="rotate(-35 65 325)"
            fill="#0d1e15"
            opacity="0.9"
          />
          <ellipse
            cx="100"
            cy="275"
            rx="16"
            ry="7"
            transform="rotate(-40 100 275)"
            fill="#0d1e15"
            opacity="0.9"
          />
          <ellipse
            cx="135"
            cy="235"
            rx="12"
            ry="5"
            transform="rotate(-45 135 235)"
            fill="#0d1e15"
            opacity="0.9"
          />

          <ellipse
            cx="150"
            cy="355"
            rx="18"
            ry="7"
            transform="rotate(25 150 355)"
            fill="#0d1e15"
            opacity="0.9"
          />
          <ellipse
            cx="190"
            cy="305"
            rx="16"
            ry="6"
            transform="rotate(20 190 305)"
            fill="#0d1e15"
            opacity="0.9"
          />
          <ellipse
            cx="220"
            cy="255"
            rx="12"
            ry="5"
            transform="rotate(15 220 255)"
            fill="#0d1e15"
            opacity="0.9"
          />
        </g>

        {/* ==================== LAYER 4: Delicate Golden Botanical Sprigs ==================== */}
        <g opacity="0.6">
          <path
            d="M 50 440 Q 160 380 270 330"
            stroke="url(#goldVeinGrad)"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
          <circle cx="210" cy="358" r="3" fill="#d4a34b" />
          <circle cx="270" cy="330" r="2.5" fill="#e5b758" />
          <circle cx="160" cy="385" r="2" fill="#d4a34b" />
        </g>
      </svg>
    </div>
  );
}
