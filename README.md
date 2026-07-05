Modify the assessment workspace #eduassess-app-root to include a 'Shuffle Questions' toggle in the header, allowing students to randomize their question order before starting an attempt.

Update the quiz initiation logic in App.tsx to verify the student's remaining attempt count and pass/fail status immediately upon opening the quiz attempt dialog, ensuring the 'Retry' button state is accurately synchronized with the server's latest quiz metadata.

Implement a visual status indicator in the Audit Log table that highlights logs with a 'WARNING' or 'ERROR' action severity in a different color to improve scanability for admins.

Add a global 'ConfirmationDialog' component for destructive actions like suspending users or deleting assignments, and integrate it into the existing buttons to prevent accidental clicks.

CSS selector: #eduassess-app-root. Within the assessment result card, add a small 'lock' icon with a tooltip that displays 'Attempt locked for review' if the attempt has been already evaluated or if the quiz duration has passed.

CSS selector: #eduassess-app-root. Add a visual status indicator to assessment cards that shows a 'Urgent' red border animation if the current time is within 30 minutes of the assessment's completion window, using the quiz configuration data.