{ pkgs }: {
	deps = [
   pkgs.openssh_hpn
		pkgs.nodejs-16_x
		pkgs.nodePackages.typescript-language-server
		pkgs.yarn
		pkgs.replitPackages.jest
	];
}