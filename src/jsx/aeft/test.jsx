var folder = new Folder("//buck/work/current/BUCK5_SANDBOX/Production/Common");
var file = new File();
folder.selectDlg();
if (file) {
    alert("Selected file: " + folder.fsName);
}