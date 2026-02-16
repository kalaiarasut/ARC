import 'package:flutter/foundation.dart';

enum UploadFlowType { submit, sync }

class UploadTimelineEvent {
  final String message;
  final DateTime at;

  const UploadTimelineEvent({required this.message, required this.at});
}

class UploadProgressState {
  final UploadFlowType flowType;
  final String title;
  final String subtitle;
  final int totalSteps;
  final int completedSteps;
  final bool isCompleted;
  final bool isFailed;
  final String? completionMessage;
  final List<UploadTimelineEvent> timeline;

  const UploadProgressState({
    required this.flowType,
    required this.title,
    required this.subtitle,
    required this.totalSteps,
    required this.completedSteps,
    required this.timeline,
    this.isCompleted = false,
    this.isFailed = false,
    this.completionMessage,
  });

  double get progress {
    if (totalSteps <= 0) return 0;
    final v = completedSteps / totalSteps;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  UploadProgressState copyWith({
    String? title,
    String? subtitle,
    int? totalSteps,
    int? completedSteps,
    bool? isCompleted,
    bool? isFailed,
    String? completionMessage,
    List<UploadTimelineEvent>? timeline,
  }) {
    return UploadProgressState(
      flowType: flowType,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      totalSteps: totalSteps ?? this.totalSteps,
      completedSteps: completedSteps ?? this.completedSteps,
      isCompleted: isCompleted ?? this.isCompleted,
      isFailed: isFailed ?? this.isFailed,
      completionMessage: completionMessage ?? this.completionMessage,
      timeline: timeline ?? this.timeline,
    );
  }
}

class UploadProgressController {
  UploadProgressController._();

  static final UploadProgressController instance = UploadProgressController._();

  final ValueNotifier<UploadProgressState?> state = ValueNotifier<UploadProgressState?>(null);

  void start({
    required UploadFlowType flowType,
    required String title,
    required String subtitle,
    required int totalSteps,
  }) {
    final now = DateTime.now();
    state.value = UploadProgressState(
      flowType: flowType,
      title: title,
      subtitle: subtitle,
      totalSteps: totalSteps <= 0 ? 1 : totalSteps,
      completedSteps: 0,
      timeline: [UploadTimelineEvent(message: 'Started', at: now)],
    );
  }

  void step(String message, {String? subtitle}) {
    final current = state.value;
    if (current == null) return;
    final nextCompleted = (current.completedSteps + 1).clamp(0, current.totalSteps);
    state.value = current.copyWith(
      subtitle: subtitle ?? current.subtitle,
      completedSteps: nextCompleted,
      timeline: [
        ...current.timeline,
        UploadTimelineEvent(message: message, at: DateTime.now()),
      ],
    );
  }

  void note(String message, {String? subtitle}) {
    final current = state.value;
    if (current == null) return;
    state.value = current.copyWith(
      subtitle: subtitle ?? current.subtitle,
      timeline: [
        ...current.timeline,
        UploadTimelineEvent(message: message, at: DateTime.now()),
      ],
    );
  }

  void advance({int by = 1, String? subtitle}) {
    final current = state.value;
    if (current == null) return;
    final nextCompleted = (current.completedSteps + by).clamp(0, current.totalSteps);
    state.value = current.copyWith(
      subtitle: subtitle ?? current.subtitle,
      completedSteps: nextCompleted,
    );
  }

  void complete(String message) {
    final current = state.value;
    if (current == null) return;
    state.value = current.copyWith(
      completedSteps: current.totalSteps,
      isCompleted: true,
      isFailed: false,
      completionMessage: message,
      timeline: [
        ...current.timeline,
        UploadTimelineEvent(message: message, at: DateTime.now()),
      ],
    );
  }

  void fail(String message) {
    final current = state.value;
    if (current == null) return;
    state.value = current.copyWith(
      isCompleted: true,
      isFailed: true,
      completionMessage: message,
      timeline: [
        ...current.timeline,
        UploadTimelineEvent(message: message, at: DateTime.now()),
      ],
    );
  }

  void clear() {
    state.value = null;
  }
}
