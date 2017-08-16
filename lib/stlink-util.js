'use babel';

export default function getCurrentProjectDir() {

    var editor = atom.workspace.getActiveTextEditor();

    if(editor) {
        var f = editor.getPath();

        if(f) {
            var p = atom.project.relativizePath(f);

            if(p) {
                return p[0];
            }
        }
    }

    return null;
}
