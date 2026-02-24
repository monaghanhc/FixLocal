import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ReportStatus } from '@fixlocal/shared';

type StatusBadgeProps = {
  status: ReportStatus;
};

const statusStyles: Record<ReportStatus, { label: string; bg: string; fg: string }> = {
  queued: {
    label: 'Queued',
    bg: '#fef3c7',
    fg: '#92400e',
  },
  sent: {
    label: 'Sent',
    bg: '#dcfce7',
    fg: '#166534',
  },
  failed: {
    label: 'Failed',
    bg: '#fee2e2',
    fg: '#991b1b',
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const palette = statusStyles[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{palette.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
