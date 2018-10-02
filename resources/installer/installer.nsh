!macro customInit
	CreateDirectory $APPDATA\RamboxBK
	CopyFiles $APPDATA\Rambox\*.* $APPDATA\RamboxBK
	nsExec::Exec '"$LOCALAPPDATA\Rambox\Update.exe" --uninstall -s'
!macroend

!macro customInstall
	CopyFiles $APPDATA\RamboxBK\*.* $APPDATA\Rambox
	RMDir /r $APPDATA\RamboxBK
!macroend
