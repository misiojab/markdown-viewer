import Gio from 'gi://Gio?version=2.0';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MarkdownViewerPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        // --- Markdown File Group ---
        const fileGroup = new Adw.PreferencesGroup({
            title: 'Markdown File',
            description: 'Select the file to display in the panel',
        });

        const fileRow = new Adw.ActionRow({ title: 'File Path' });

        const fileEntry = new Gtk.Entry({
            hexpand: true,
            placeholder_text: '/path/to/file.md',
        });

        fileEntry.set_text(settings.get_string('file-path'));
        fileEntry.connect('changed', () => {
            settings.set_string('file-path', fileEntry.get_text());
        });

        const fileButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            tooltip_text: 'Browse for markdown file',
        });

        fileButton.connect('clicked', () => {
            const chooser = new Gtk.FileChooserNative({
                title: 'Select Markdown File',
                action: Gtk.FileChooserAction.OPEN,
                modal: true,
            });

            const filter = new Gtk.FileFilter();
            filter.set_name('Markdown files');
            filter.add_pattern('*.md');
            filter.add_pattern('*.markdown');
            chooser.set_filter(filter);

            chooser.connect('response', (self, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                    const file = chooser.get_file();
                    if (file) {
                        const path = file.get_path();
                        fileEntry.set_text(path);
                        settings.set_string('file-path', path);
                    }
                }
                chooser.destroy();
            });

            chooser.show();
        });

        const fileBox = new Gtk.Box({ spacing: 6 });
        fileBox.append(fileEntry);
        fileBox.append(fileButton);
        fileRow.add_suffix(fileBox);
        fileGroup.add(fileRow);
        page.add(fileGroup);

        // --- Line Range Group ---
        const rangeGroup = new Adw.PreferencesGroup({
            title: 'Content Range',
            description: 'Select which lines to display',
        });

        const rangeRow = new Adw.ActionRow({ title: 'Line Range' });

        const adjustmentStart = new Gtk.Adjustment({ lower: 1, upper: 9999, step_increment: 1 });
        const startSpin = new Gtk.SpinButton({ adjustment: adjustmentStart, numeric: true });
        startSpin.set_value(settings.get_int('start-line'));
        startSpin.connect('value-changed', () => {
            settings.set_int('start-line', startSpin.get_value_as_int());
        });

        const adjustmentEnd = new Gtk.Adjustment({ lower: 0, upper: 9999, step_increment: 1 });
        const endSpin = new Gtk.SpinButton({ adjustment: adjustmentEnd, numeric: true });
        endSpin.set_value(settings.get_int('end-line'));
        endSpin.connect('value-changed', () => {
            settings.set_int('end-line', endSpin.get_value_as_int());
        });

        const rangeBox = new Gtk.Box({ spacing: 6 });
        rangeBox.append(new Gtk.Label({ label: 'From' }));
        rangeBox.append(startSpin);
        rangeBox.append(new Gtk.Label({ label: 'to' }));
        rangeBox.append(endSpin);
        rangeBox.append(new Gtk.Label({ label: '(0 = all)' }));
        rangeRow.add_suffix(rangeBox);
        rangeGroup.add(rangeRow);
        page.add(rangeGroup);

        // --- Kanban View Group ---
        const kanbanGroup = new Adw.PreferencesGroup({
            title: 'Kanban View',
            description: 'Enable Kanban-style display of markdown content',
        });

        const kanbanRow = new Adw.ActionRow({ title: 'Enable Kanban View' });

        const kanbanSwitch = new Gtk.Switch({
            active: settings.get_boolean('kanban-enabled'),
        });

        kanbanSwitch.connect('notify::active', () => {
            settings.set_boolean('kanban-enabled', kanbanSwitch.active);
        });

        kanbanRow.add_suffix(kanbanSwitch);
        kanbanRow.activatable_widget = kanbanSwitch;
        kanbanGroup.add(kanbanRow);
        page.add(kanbanGroup);
    }
}
