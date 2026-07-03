
Action: file_editor create /app/frontend/app/index.tsx --file-text "import { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '@/src/theme';
import { STREAMS, CATEGORIES, Stream } from '@/src/data/streams';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number]>('ALL');

  const filtered = useMemo(
    () =>
      activeCat === 'ALL'
        ? STREAMS
        : STREAMS.filter((s) => s.category === activeCat),
    [activeCat],
  );

  const hero = STREAMS[1]; // Tears of Steel — cinematic hero

  const openPlayer = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/player/${id}` as never);
    },
    [router],
  );

  return (
    <View style={styles.root} testID=\"home-screen\">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Header */}
        <BlurView
          intensity={40}
          tint=\"dark\"
          style={[
            styles.header,
            { paddingTop: insets.top + theme.spacing.sm },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText} testID=\"brand-wordmark\">
                ExoPlay
              </Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => Haptics.selectionAsync()}
              style={styles.iconBtn}
              testID=\"search-button\"
            >
              <Ionicons name=\"search\" size={20} color={theme.color.onSurface} />
            </Pressable>
          </View>
        </BlurView>

        {/* Hero Card */}
        <Pressable
          onPress={() => openPlayer(hero.id)}
          style={[styles.hero, { height: (width - 32) * 1.15 }]}
          testID=\"hero-card\"
        >
          <Image
            source={{ uri: hero.thumbnail }}
            style={StyleSheet.absoluteFill}
            contentFit=\"cover\"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(12,12,14,0.85)', theme.color.surface]}
            locations={[0, 0.4, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={styles.drmBadge}>
                <Ionicons name=\"sparkles\" size={11} color={theme.color.brand} />
                <Text style={styles.drmBadgeText}>FEATURED</Text>
              </View>
              <Text style={styles.heroMeta}>{hero.year}  •  {hero.duration}  •  4K</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {hero.title}
            </Text>
            <Text style={styles.heroSub} numberOfLines={2}>
              {hero.subtitle}
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.playCta}
                onPress={() => openPlayer(hero.id)}
                testID=\"hero-play-button\"
              >
                <Ionicons name=\"play\" size={16} color={theme.color.onBrand} />
                <Text style={styles.playCtaText}>Play</Text>
              </Pressable>
              <BlurView intensity={30} tint=\"dark\" style={styles.infoCta}>
                <Ionicons name=\"information-circle-outline\" size={16} color={theme.color.onSurface} />
                <Text style={styles.infoCtaText}>Info</Text>
              </BlurView>
            </View>
          </View>
        </Pressable>

        {/* Category Chips */}
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORIES.map((cat) => {
              const active = activeCat === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveCat(cat);
                  }}
                  style={[styles.chip, active && styles.chipActive]}
                  testID={`chip-${cat.toLowerCase()}`}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Trending Shelf */}
        <Shelf title=\"Trending Streams\" data={filtered} onPress={openPlayer} />

        {/* DRM Shelf */}
        <Shelf
          title=\"Protected Content · DRM\"
          data={STREAMS.filter((s) => s.category === 'DRM')}
          onPress={openPlayer}
        />

        {/* All streams grid */}
        <Text style={styles.sectionTitle}>All Streams</Text>
        <View style={styles.grid}>
          {filtered.map((s) => (
            <Pressable
              key={s.id}
              style={styles.gridItem}
              onPress={() => openPlayer(s.id)}
              testID={`grid-item-${s.id}`}
            >
              <View style={styles.gridThumbWrap}>
                <Image
                  source={{ uri: s.thumbnail }}
                  style={styles.gridThumb}
                  contentFit=\"cover\"
                  transition={150}
                />
                {s.drm && (
                  <View style={styles.gridDrmChip}>
                    <Ionicons name=\"lock-closed\" size={9} color={theme.color.brand} />
                    <Text style={styles.gridDrmText}>{s.drm.type.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.gridDur}>
                  <Text style={styles.gridDurText}>{s.duration}</Text>
                </View>
              </View>
              <Text style={styles.gridTitle} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={styles.gridSub} numberOfLines={1}>
                {s.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Shelf({
  title,
  data,
  onPress,
}: {
  title: string;
  data: Stream[];
  onPress: (id: string) => void;
}) {
  if (data.length === 0) return null;
  return (
    <View style={{ marginTop: theme.spacing.xl }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.shelfCard}
            onPress={() => onPress(item.id)}
            testID={`shelf-card-${item.id}`}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.shelfImg}
              contentFit=\"cover\"
              transition={150}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.shelfScrim}
            />
            <View style={styles.shelfMeta}>
              {item.drm && (
                <View style={styles.shelfDrmChip}>
                  <Ionicons name=\"lock-closed\" size={10} color={theme.color.brand} />
                  <Text style={styles.shelfDrmText}>DRM</Text>
                </View>
              )}
              <Text style={styles.shelfTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.shelfSub} numberOfLines={1}>
                {item.category}  •  {item.duration}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.surface,
  },
  header: {
    backgroundColor: 'rgba(12,12,14,0.65)',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.color.brand,
  },
  brandText: {
    color: theme.color.onSurface,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
  },
  hero: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceSecondary,
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  drmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(66,51,4,0.9)',
    borderColor: theme.color.brand,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  drmBadgeText: {
    color: theme.color.brandSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroMeta: {
    color: theme.color.onSurfaceTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  heroTitle: {
    color: theme.color.onSurface,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: theme.color.onSurfaceSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  heroActions: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  playCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.color.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  playCtaText: {
    color: theme.color.onBrand,
    fontWeight: '700',
    fontSize: 14,
  },
  infoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.borderStrong,
  },
  infoCtaText: { color: theme.color.onSurface, fontSize: 14, fontWeight: '600' },
  chipsWrap: {
    marginTop: theme.spacing.lg,
    height: 56,
    justifyContent: 'center',
  },
  chipsRow: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.color.brand,
    borderColor: theme.color.brand,
  },
  chipText: {
    color: theme.color.onSurfaceSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: { color: theme.color.onBrand },
  sectionTitle: {
    color: theme.color.onSurface,
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.2,
  },
  shelfCard: {
    width: 260,
    height: 160,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceSecondary,
  },
  shelfImg: { ...StyleSheet.absoluteFillObject },
  shelfScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  shelfMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
  },
  shelfDrmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(66,51,4,0.85)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  shelfDrmText: {
    color: theme.color.brandSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shelfTitle: { color: theme.color.onSurface, fontSize: 15, fontWeight: '700' },
  shelfSub: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  gridItem: { width: '47%' },
  gridThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceSecondary,
  },
  gridThumb: { ...StyleSheet.absoluteFillObject },
  gridDrmChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(12,12,14,0.85)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  gridDrmText: {
    color: theme.color.brandSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  gridDur: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(12,12,14,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  gridDurText: { color: theme.color.onSurface, fontSize: 10, fontWeight: '600' },
  gridTitle: {
    color: theme.color.onSurface,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  gridSub: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
});
"
Observation: Overwrite successful: /app/frontend/app/index.tsx
