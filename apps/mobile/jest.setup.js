/* eslint-disable no-undef */
import React from 'react';

global.__DEV__ = false;
jest.setTimeout(30000);

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
}
if (typeof global.cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Mock ErrorUtils
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(),
};

// Disable devtools & timers override setup in test
jest.mock('react-native/Libraries/Core/setUpReactDevTools', () => ({
  connectToDevTools: jest.fn(),
}));

jest.mock('react-native/Libraries/Core/setUpTimers', () => ({}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const createMockIcon = (family) => (props) =>
    React.createElement(
      Text,
      { ...props, testID: props.testID || `icon-${family}-${props.name}` },
      props.name || family,
    );
  return {
    Ionicons: createMockIcon('Ionicons'),
    MaterialIcons: createMockIcon('MaterialIcons'),
    MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
    Feather: createMockIcon('Feather'),
    FontAwesome: createMockIcon('FontAwesome'),
    FontAwesome5: createMockIcon('FontAwesome5'),
    AntDesign: createMockIcon('AntDesign'),
  };
});

// Mock Animated native helper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Keyboard
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
  metrics: jest.fn(() => null),
  isVisible: jest.fn(() => false),
}));

// Mock NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class NativeEventEmitter {
    addListener = jest.fn(() => ({ remove: jest.fn() }));
    removeListeners = jest.fn();
    removeAllListeners = jest.fn();
    emit = jest.fn();
  };
});

const mockDimensions = {
  window: { fontScale: 1, height: 800, scale: 2, width: 400 },
  screen: { fontScale: 1, height: 800, scale: 2, width: 400 },
};

const mockPlatformConstants = {
  isTesting: true,
  reactNativeVersion: { major: 0, minor: 74, patch: 5 },
  osVersion: '14.0',
  systemName: 'iOS',
  interfaceIdiom: 'phone',
  forceTouchAvailable: false,
  ServerHost: 'localhost:8081',
  getConstants() {
    return this;
  },
};

const mockDeviceInfo = {
  Dimensions: mockDimensions,
  getConstants() {
    return {
      Dimensions: mockDimensions,
    };
  },
};

const mockAppStateConstants = {
  initialAppState: 'active',
  getConstants() {
    return {
      initialAppState: 'active',
    };
  },
  getCurrentAppState: (success) => success && success({ app_state: 'active' }),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListeners: jest.fn(),
};

const mockSourceCode = {
  scriptURL: 'http://localhost:8081/index.bundle?platform=ios',
  getConstants() {
    return {
      scriptURL: 'http://localhost:8081/index.bundle?platform=ios',
    };
  },
};

global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
};

// Mock JSTimers & NativeTiming
jest.mock('react-native/Libraries/Core/Timers/NativeTiming', () => ({
  default: {
    createTimer: jest.fn(),
    deleteTimer: jest.fn(),
    setSendIdleEvents: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('react-native/Libraries/Core/Timers/JSTimers', () => ({
  setTimeout: (fn, ms = 0, ...args) => globalThis.setTimeout(fn, ms, ...args),
  clearTimeout: (id) => globalThis.clearTimeout(id),
  setInterval: (fn, ms = 0, ...args) => globalThis.setInterval(fn, ms, ...args),
  clearInterval: (id) => globalThis.clearInterval(id),
  setImmediate: (fn, ...args) =>
    globalThis.setImmediate
      ? globalThis.setImmediate(fn, ...args)
      : globalThis.setTimeout(fn, 0, ...args),
  clearImmediate: (id) =>
    globalThis.clearImmediate ? globalThis.clearImmediate(id) : globalThis.clearTimeout(id),
  requestAnimationFrame: (fn) => globalThis.setTimeout(fn, 0),
  cancelAnimationFrame: (id) => globalThis.clearTimeout(id),
  queueReactNativeMicrotask: (fn) => globalThis.queueMicrotask(fn),
  clearReactNativeMicrotask: jest.fn(),
  callTimers: jest.fn(),
  clearTimers: jest.fn(),
  emitTimeDriftWarning: jest.fn(),
}));

// Mock TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: (name) => {
    if (name === 'PlatformConstants') return mockPlatformConstants;
    if (name === 'DeviceInfo') return mockDeviceInfo;
    if (name === 'AppState') return mockAppStateConstants;
    if (name === 'SourceCode') return mockSourceCode;
    if (name === 'Timing' || name === 'NativeTiming') return mockTiming;
    return {
      getConstants: () => ({}),
    };
  },
  get: (name) => {
    if (name === 'PlatformConstants') return mockPlatformConstants;
    if (name === 'DeviceInfo') return mockDeviceInfo;
    if (name === 'AppState') return mockAppStateConstants;
    if (name === 'SourceCode') return mockSourceCode;
    if (name === 'Timing' || name === 'NativeTiming') return mockTiming;
    return {
      getConstants: () => ({}),
    };
  },
}));

// Mock NativeAppState
jest.mock('react-native/Libraries/AppState/NativeAppState', () => ({
  default: mockAppStateConstants,
  __esModule: true,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve(null);
    }),
    getItem: jest.fn((key) => {
      return Promise.resolve(store[key] || null);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve(null);
    }),
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock global fetch
if (!global.fetch) {
  global.fetch = jest.fn();
}
