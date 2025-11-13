import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props { children: React.ReactNode; }

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: string }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary:', error);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>App Error: {this.state.error}</Text>
          <TouchableOpacity onPress={this.retry} style={{ backgroundColor: '#FF6B00', padding: 15, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}