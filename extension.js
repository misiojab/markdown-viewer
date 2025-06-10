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
    _init(settings, extension) {
        super._init(0.0, 'Markdown Viewer');
        this._settings = settings;
        this._extension = extension;

        const iconFile = Gio.File.new_for_path(
            `${this._extension.dir.get_path()}/icons/icon.svg`
        );

        this.icon = new St.Icon({
            gicon: new Gio.FileIcon({ file: iconFile }),
            style_class: 'system-status-icon',
        });
        this.add_child(this.icon);

        this._updateMenu();
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
                        const updated = [];

                        let currentSection = null;
                        let sectionItems = [];

                        const flushSection = () => {
                            if (currentSection && sectionItems.length) {
                                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(currentSection));
                                sectionItems.forEach(({ line, index }) => {
                                    const isChecked = line.match(/^- \[x\]/i);
                                    const icon = new St.Icon({
                                        icon_name: isChecked ? 'checkbox-checked-symbolic' : 'checkbox-symbolic',
                                        style_class: 'popup-menu-icon'
                                    });

                                    const item = new PopupMenu.PopupMenuItem(line.replace(/^\s*- \[[x ]\] /i, ''));
                                    item.insert_child_at_index(icon, 0);

                                    item.connect('activate', () => {
                                        lines[index] = isChecked
                                            ? line.replace('- [x]', '- [ ]')
                                            : line.replace('- [ ]', '- [x]');
                                        this._writeFile(file, lines);
                                    });

                                    this.menu.addMenuItem(item);
                                });
                            }
                        };

                        lines.forEach((line, idx) => {
                            if (line.startsWith('## ')) {
                                flushSection();
                                currentSection = line.replace(/^##\s*/, '').trim();
                                sectionItems = [];
                            } else if (line.match(/^\s*- \[[ xX]\] /)) {
                                sectionItems.push({ line, index: idx });
                            }
                        });
                        flushSection();
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

    _writeFile(file, lines) {
        try {
            const output = lines.join('\n');
            file.replace_contents_bytes_async(
                new GLib.Bytes(new TextEncoder().encode(output)),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
                () => this._updateMenu()
            );
        } catch (e) {
            logError(e, 'Failed to write to file');
        }
    }

    _addMenuItem(text) {
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(text));
    }
});

export default class MarkdownViewerExtension extends Extension {
    enable() {
        this._settings = this.getSettings(SETTINGS_SCHEMA);
        this._indicator = new MarkdownViewerIndicator(this._settings, this);
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
