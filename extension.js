import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import GLib from 'gi://GLib';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.markdown-viewer';

const MarkdownViewerIndicator = GObject.registerClass(
class MarkdownViewerIndicator extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Markdown Viewer');
        this._settings = settings;

        // Panel icon
        this.icon = new St.Icon({
            icon_name: 'document-view-symbolic',
            style_class: 'system-status-icon'
        });
        this.add_child(this.icon);

        // Setup menu
        this.menu.box.add_style_class_name('markdown-menu');
        this._updateMenu();

        // Watch for settings changes
        this._settingsChangedId = this._settings.connect('changed', () => this._updateMenu());
    }

    destroy() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        super.destroy();
    }

    _updateMenu() {
        this.menu.removeAll();

        const filePath = this._settings.get_string('file-path');
        if (!filePath) {
            this._addMenuItem('No file selected - configure in preferences');
            return;
        }

        try {
            const file = Gio.File.new_for_path(filePath);
            file.load_contents_async(null, (file_, res) => {
                try {
                    const [success, contents] = file_.load_contents_finish(res);
                    if (success) {
                        const text = new TextDecoder().decode(contents);
                        const lines = text.split('\n');

                        const start = Math.max(0, this._settings.get_int('start-line') - 1);
                        const end = this._settings.get_int('end-line') || lines.length;
                        const visibleLines = lines.slice(start, end);

                        if (visibleLines.length === 0) {
                            this._addMenuItem('No content in selected range');
                        } else {
                            visibleLines.forEach(line => {
                                if (line.trim()) this._addMenuItem(line);
                            });
                        }
                    }
                } catch (e) {
                    logError(e, 'Failed to load file');
                    this._addMenuItem('Error loading file');
                }
            });
        } catch (e) {
            logError(e, 'Exception while reading file');
            this._addMenuItem('Error loading file');
        }
    }

    _addMenuItem(text) {
        const item = new PopupMenu.PopupMenuItem(text);
        this.menu.addMenuItem(item);
    }
});

export default class MarkdownViewerExtension extends Extension {
    enable() {
        this._settings = this.getSettings(SETTINGS_SCHEMA);
        this._indicator = new MarkdownViewerIndicator(this._settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._settings = null;
    }
}
