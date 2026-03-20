import 'package:flutter/material.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> pushRouteWhenReady(
  Route<dynamic> route, {
  int maxAttempts = 20,
}) async {
  for (var i = 0; i < maxAttempts; i++) {
    final navigator = appNavigatorKey.currentState;
    if (navigator != null) {
      navigator.push(route);
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 150));
  }
}
