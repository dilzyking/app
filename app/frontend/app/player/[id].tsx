
Action: file_editor create /app/frontend/app/player/[id].tsx --file-text "import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/src/theme';
import { getStreamById } from '@/src/data/streams';

const SPEEDS = [0.5, 1.0, 1.25, 1.5, 2.0];

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const stream = useMemo(() => getStreamById(id || ''), [id]);

  const source: VideoSource = useMemo(() => {
    if (!stream) return null as unknown as VideoSource;
    const src: VideoSource = { uri: stream.manifestUri };
    if (stream.drm) {
      (src as any).drm = {
        type: stream.drm.type,
        licenseServer: stream.drm.licenseServer,
      };
    }
    return src;
  }, [stream]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
    error: null as null | Error,
  });

  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  }) as any;

  const duration = player.duration || 0;

  // Controls fade
  const overlayOpacity = useSharedValue(1);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 300 });
      runOnJS(setShowControls)(false);
    }, 3500);
  }, [overlayOpacity]);

  const revealControls = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 200 });
    setShowControls(true);
    scheduleHide();
  }, [overlayOpacity, scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [scheduleHide]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const togglePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    revealControls();
  }, [player, revealControls]);

  const seekBy = useCallback(
    (delta: number) => {
      const target = Math.max(0, Math.min((player.currentTime || 0) + delta, duration || 0));
      player.currentTime = target;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      revealControls();
    },
    [player, duration, revealControls],
  );

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    player.playbackRate = SPEEDS[next];
    Haptics.selectionAsync();
    revealControls();
  }, [speedIdx, player, revealControls]);

  // Gestures
  const tapCenter = Gesture.Tap()
    .maxDuration(220)
    .onEnd(() => {
      runOnJS(revealControls)();
    });

  const doubleTapLeft = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(280)
    .onEnd(() => {
      runOnJS(seekBy)(-10);
    });

  const doubleTapRight = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(280)
    .onEnd(() => {
      runOnJS(seekBy)(10);
    });

  const leftGesture = Gesture.Exclusive(doubleTapLeft, tapCenter);
  const rightGesture = Gesture.Exclusive(doubleTapRight, tapCenter);

  // Seekbar drag
  const [scrubbing, setScrubbing] = useState(false);
  const scrubTime = useRef(0);
  const barWidth = useRef(1);
  const [scrubX, setScrubX] = useState(0);

  const seekAbs = useCallback(
    (secs: number) => {
      player.currentTime = Math.max(0, Math.min(secs, duration || 0));
    },
    [player, duration],
  );

  const barPan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(setScrubbing)(true);
      const ratio = Math.max(0, Math.min(1, e.x / (barWidth.current || 1)));
      const t = ratio * (duration || 0);
      scrubTime.current = t;
      runOnJS(setScrubX)(ratio * (barWidth.current || 1));
      runOnJS(revealControls)();
    })
    .onUpdate((e) => {
      const ratio = Math.max(0, Math.min(1, e.x / (barWidth.current || 1)));
      const t = ratio * (duration || 0);
      scrubTime.current = t;
      runOnJS(setScrubX)(ratio * (barWidth.current || 1));
    })
    .onEnd(() => {
      runOnJS(seekAbs)(scrubTime.current);
      runOnJS(setScrubbing)(false);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const barTap = Gesture.Tap().onEnd((e) => {
    const ratio = Math.max(0, Math.min(1, e.x / (barWidth.current || 1)));
    const t = ratio * (duration || 0);
    runOnJS(seekAbs)(t);
    runOnJS(revealControls)();
  });

  const barGesture = Gesture.Race(barPan, barTap);

  const positionRatio = useMemo(() => {
    if (scrubbing && barWidth.current) return scrubX / (barWidth.current || 1);
    if (!duration) return 0;
    return Math.max(0, Math.min(1, (currentTime || 0) / duration));
  }, [scrubbing, scrubX, currentTime, duration]);

  if (!stream) {
    return (
      <View style={styles.center} testID=\"player-not-found\">
        <Text style={styles.errText}>Stream not found</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryTxt}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const displayTime = scrubbing ? scrubTime.current : currentTime || 0;

  return (
    <View style={styles.root} testID=\"player-screen\">
      <StatusBar hidden />

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit=\"contain\"
        allowsPictureInPicture
        allowsFullscreen={false}
        nativeControls={false}
      />

      {/* Gesture overlay: left half doubleTap for -10s, right for +10s */}
      <View style={styles.gestureWrap} pointerEvents=\"box-none\">
        <GestureDetector gesture={leftGesture}>
          <Animated.View style={styles.gestureHalf} />
        </GestureDetector>
        <GestureDetector gesture={rightGesture}>
          <Animated.View style={styles.gestureHalf} />
        </GestureDetector>
      </View>

      {/* Controls overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, overlayStyle]}
        pointerEvents={showControls ? 'box-none' : 'none'}
      >
        {/* Top scrim */}
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent']}
          style={styles.topScrim}
          pointerEvents=\"none\"
        />
        {/* Bottom scrim */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomScrim}
          pointerEvents=\"none\"
        />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.roundBtn}
            testID=\"player-back\"
          >
            <Ionicons name=\"chevron-back\" size={22} color={theme.color.onSurface} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text numberOfLines={1} style={styles.topTitle}>
              {stream.title}
            </Text>
            <Text numberOfLines={1} style={styles.topSub}>
              {stream.subtitle}
            </Text>
          </View>
          {stream.drm && (
            <View style={styles.drmPill} testID=\"drm-badge\">
              <Ionicons name=\"lock-closed\" size={11} color={theme.color.brand} />
              <Text style={styles.drmPillText}>{stream.drm.type.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Center controls */}
        <View style={styles.centerRow} pointerEvents=\"box-none\">
          <Pressable
            style={styles.sideBtn}
            onPress={() => seekBy(-10)}
            hitSlop={12}
            testID=\"skip-back-10\"
          >
            <Ionicons name=\"play-back\" size={26} color={theme.color.onSurface} />
            <Text style={styles.sideBtnText}>10</Text>
          </Pressable>

          <Pressable
            style={styles.playBtnBig}
            onPress={togglePlay}
            hitSlop={12}
            testID=\"play-pause\"
          >
            {status === 'loading' ? (
              <ActivityIndicator color={theme.color.onBrand} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color={theme.color.onBrand}
              />
            )}
          </Pressable>

          <Pressable
            style={styles.sideBtn}
            onPress={() => seekBy(10)}
            hitSlop={12}
            testID=\"skip-forward-10\"
          >
            <Ionicons name=\"play-forward\" size={26} color={theme.color.onSurface} />
            <Text style={styles.sideBtnText}>10</Text>
          </Pressable>
        </View>

        {/* Bottom control pill */}
        <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 12 }]}>
          <BlurView intensity={40} tint=\"dark\" style={styles.bottomPill}>
            <View style={styles.timeRow}>
              <Text style={styles.timeText} testID=\"current-time\">
                {formatTime(displayTime)}
              </Text>
              <Text style={styles.timeTextDim}>{formatTime(duration)}</Text>
            </View>

            <GestureDetector gesture={barGesture}>
              <View
                style={styles.barHit}
                onLayout={(e) => {
                  barWidth.current = e.nativeEvent.layout.width;
                }}
              >
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${positionRatio * 100}%` }]}
                  />
                </View>
                <View
                  style={[
                    styles.barThumb,
                    {
                      left: `${positionRatio * 100}%`,
                      transform: [
                        { translateX: -8 },
                        { scale: scrubbing ? 1.4 : 1 },
                      ],
                    },
                  ]}
                />
              </View>
            </GestureDetector>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionBtn}
                onPress={cycleSpeed}
                testID=\"speed-button\"
              >
                <Ionicons name=\"speedometer-outline\" size={18} color={theme.color.onSurface} />
                <Text style={styles.actionText}>{SPEEDS[speedIdx]}x</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowSpeedMenu(true);
                  revealControls();
                }}
                testID=\"tracks-button\"
              >
                <Ionicons name=\"options-outline\" size={18} color={theme.color.onSurface} />
                <Text style={styles.actionText}>Quality</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  Haptics.selectionAsync();
                  try {
                    await (player as any).enterFullscreen?.();
                  } catch {}
                }}
                testID=\"fullscreen-button\"
              >
                <Ionicons name=\"expand-outline\" size={18} color={theme.color.onSurface} />
                <Text style={styles.actionText}>Full</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  Haptics.selectionAsync();
                  try {
                    await (player as any).startPictureInPicture?.();
                  } catch {}
                }}
                testID=\"pip-button\"
              >
                <Ionicons name=\"tablet-landscape-outline\" size={18} color={theme.color.onSurface} />
                <Text style={styles.actionText}>PiP</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </Animated.View>

      {/* Loading overlay */}
      {status === 'loading' && (
        <View style={styles.loadingOverlay} pointerEvents=\"none\">
          <ActivityIndicator size=\"large\" color={theme.color.brand} />
          <Text style={styles.loadingText}>Buffering…</Text>
        </View>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <View style={styles.errorOverlay} testID=\"player-error\">
          <Ionicons name=\"warning-outline\" size={40} color={theme.color.error} />
          <Text style={styles.errorTitle}>Playback failed</Text>
          <Text style={styles.errorMsg} numberOfLines={4}>
            {(error as any)?.message || 'The stream could not be loaded. Check network or DRM configuration.'}
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              player.replace(source);
              player.play();
            }}
            testID=\"player-retry\"
          >
            <Ionicons name=\"refresh\" size={16} color={theme.color.onBrand} />
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Speed / Options sheet */}
      {showSpeedMenu && (
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShowSpeedMenu(false)}
        >
          <BlurView intensity={50} tint=\"dark\" style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Playback Speed</Text>
            <ScrollView>
              {SPEEDS.map((sp, i) => {
                const active = i === speedIdx;
                return (
                  <Pressable
                    key={sp}
                    style={styles.sheetRow}
                    onPress={() => {
                      setSpeedIdx(i);
                      player.playbackRate = sp;
                      Haptics.selectionAsync();
                      setShowSpeedMenu(false);
                    }}
                    testID={`speed-option-${sp}`}
                  >
                    <Text style={[styles.sheetRowText, active && { color: theme.color.brand }]}>
                      {sp}x
                    </Text>
                    {active && (
                      <Ionicons name=\"checkmark\" size={18} color={theme.color.brand} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </BlurView>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gestureWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  gestureHalf: { flex: 1 },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,24,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
  },
  topTitle: { color: theme.color.onSurface, fontSize: 16, fontWeight: '700' },
  topSub: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 1 },
  drmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(66,51,4,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.brand,
  },
  drmPillText: {
    color: theme.color.brandSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  sideBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,24,0.55)',
  },
  sideBtnText: {
    color: theme.color.onSurface,
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  playBtnBig: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomWrap: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: 0,
  },
  bottomPill: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
    backgroundColor: 'rgba(20,20,24,0.4)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeText: { color: theme.color.onSurface, fontSize: 12, fontWeight: '600' },
  timeTextDim: { color: theme.color.onSurfaceTertiary, fontSize: 12 },
  barHit: {
    height: 24,
    justifyContent: 'center',
  },
  barTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.color.brand,
  },
  barThumb: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.color.brand,
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  actionText: {
    color: theme.color.onSurface,
    fontSize: 11,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.color.onSurfaceSecondary,
    fontSize: 13,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,14,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  errorTitle: {
    color: theme.color.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  errorMsg: {
    color: theme.color.onSurfaceTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
  errText: { color: theme.color.onSurface, fontSize: 16, fontWeight: '600' },
  retryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.color.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  retryTxt: { color: theme.color.onBrand, fontWeight: '700' },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(20,20,24,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.borderStrong,
    marginBottom: 14,
  },
  sheetTitle: {
    color: theme.color.onSurface,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  sheetRowText: {
    color: theme.color.onSurface,
    fontSize: 15,
    fontWeight: '600',
  },
});
"
Observation: Create successful: /app/frontend/app/player/[id].tsx
