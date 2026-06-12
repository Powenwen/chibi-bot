/* Type declarations for @skyra/discord-components-core custom elements */
import type { DiscordMessageOptions } from '@skyra/discord-components-core';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'discord-messages': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'light-theme'?: boolean; compact?: boolean; 'compact-mode'?: boolean; 'no-background'?: boolean }, HTMLElement>;
      'discord-message': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        author?: string;
        avatar?: string;
        bot?: boolean;
        'role-color'?: string;
        edited?: boolean;
        timestamp?: string;
        'message-body-only'?: boolean;
        ephemeral?: boolean;
        highlight?: boolean;
        profile?: string;
        twentyFour?: boolean;
      }, HTMLElement>;
      'discord-embed': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        slot?: string;
        color?: string;
        'embed-title'?: string;
        'author-name'?: string;
        'author-image'?: string;
        'author-url'?: string;
        thumbnail?: string;
        image?: string;
        url?: string;
        provider?: string;
        video?: string;
      }, HTMLElement>;
      'discord-embed-description': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string }, HTMLElement>;
      'discord-embed-fields': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string }, HTMLElement>;
      'discord-embed-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { fieldTitle?: string; inline?: boolean; 'inline-index'?: number }, HTMLElement>;
      'discord-embed-footer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; 'footer-image'?: string; timestamp?: Date }, HTMLElement>;
      'discord-mention': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { type?: 'user' | 'role' | 'channel' | 'voice' | 'locked' | 'thread' | 'forum' | 'server-guide' | 'channels-and-roles' | 'customize-community' | 'slash'; color?: string; highlight?: boolean }, HTMLElement>;
      'discord-reactions': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string }, HTMLElement>;
      'discord-reaction': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { name?: string; emoji?: string; count?: number; reacted?: boolean; interactive?: boolean }, HTMLElement>;
      'discord-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { type?: 'primary' | 'secondary' | 'success' | 'destructive' | 'link'; disabled?: boolean; url?: string; emoji?: string; 'emoji-name'?: string }, HTMLElement>;
      'discord-action-row': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-attachments': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string }, HTMLElement>;
      'discord-reply': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; profile?: string; edited?: boolean; attachment?: boolean; mentions?: boolean; command?: boolean; deleted?: boolean }, HTMLElement>;
      'discord-command': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; profile?: string; command?: string }, HTMLElement>;
      'discord-time': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-header': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { level?: 1 | 2 | 3 | 4 | 5 }, HTMLElement>;
      'discord-link': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { href?: string; target?: string; rel?: string }, HTMLElement>;
      'discord-bold': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-italic': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-underlined': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-code': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { multiline?: boolean }, HTMLElement>;
      'discord-spoiler': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-quote': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-subscript': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-custom-emoji': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { name?: string; url?: string; embed?: boolean }, HTMLElement>;
      'discord-unordered-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-ordered-list': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { start?: number }, HTMLElement>;
      'discord-list-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'discord-system-message': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { type?: 'join' | 'leave' | 'edit' | 'boost' | 'thread' | 'call' | 'missed-call' | 'pin' | 'alert' | 'error' | 'channel-name'; 'channel-name'?: boolean }, HTMLElement>;
      'discord-thread': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; name?: string; cta?: string }, HTMLElement>;
      'discord-thread-message': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { profile?: string }, HTMLElement>;
      'discord-invite': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { name?: string; icon?: string; url?: string; online?: number; members?: number; verified?: boolean; partnered?: boolean }, HTMLElement>;
      'discord-image-attachment': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; url?: string; height?: number; width?: number; alt?: string; 'custom-image-element'?: boolean }, HTMLElement>;
      'discord-file-attachment': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; name?: string; bytes?: number; 'bytes-unit'?: string; href?: string; target?: string; type?: string }, HTMLElement>;
      'discord-audio-attachment': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; href?: string; name?: string; bytes?: number; 'bytes-unit'?: string }, HTMLElement>;
      'discord-video-attachment': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; href?: string; poster?: string }, HTMLElement>;
      'discord-tenor-video': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { slot?: string; url?: string }, HTMLElement>;
    }
  }
}

export {};
