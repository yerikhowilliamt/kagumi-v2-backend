type MessageType = 'success' | 'error' | 'warn' | 'info';

interface GenerateMessageOptions {
  action:
    | 'Registration'
    | 'Login'
    | 'Logout'
    | 'Uploading'
    | 'create'
    | 'fetch'
    | 'update'
    | 'delete';
  subject?: string;
  type?: MessageType;
}

const pastParticipleMap: Record<string, string> = {
  create: 'created',
  fetch: 'fetched',
  update: 'updated',
  delete: 'deleted',
};

export function generateMessage({
  action,
  subject = '',
  type = 'success',
}: GenerateMessageOptions): string {
  const pastAction = pastParticipleMap[action] || action;

  const messages = {
    success: subject
      ? `${capitalize(subject)} ${pastAction} successfully`
      : `${capitalize(pastAction)} successfully`,
    error: subject ? `Failed to ${action} ${subject}` : `Failed to ${action}`,
    warn: subject
      ? `Warning during ${action} ${subject}`
      : `Warning during ${action}`,
    info: subject
      ? `${capitalize(subject)} ${pastAction} information`
      : `${capitalize(action)} information`,
  };

  return messages[type];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
