import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The application encountered an unexpected state. You can reload the app to continue.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorBox} showsVerticalScrollIndicator={true}>
                <Text style={styles.errorTitle}>{this.state.error.toString()}</Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.stackText}>
                    {this.state.errorInfo.componentStack.slice(0, 300)}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={this.handleReload}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.reloadText}>Reload App</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  errorBox: {
    width: '100%',
    maxHeight: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  stackText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    width: '100%',
  },
  reloadText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
