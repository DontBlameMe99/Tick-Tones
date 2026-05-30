{
  description = "TypeScript (Bun) dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    nixpkgs,
    flake-utils,
    git-hooks,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {inherit system;};

      inherit (pkgs) bun;
      node = pkgs.nodejs;

      mkHook = name: entry: {
        enable = true;
        inherit name entry;
        language = "system";
        pass_filenames = false;
      };

      hooks = git-hooks.lib.${system}.run {
        src = pkgs.lib.cleanSource ./.;

        hooks = {
          alejandra.enable = true;

          biome-check =
            mkHook "biome format"
            "${pkgs.biome}/bin/biome format --write .";

          typecheck =
            mkHook "tsc"
            "${pkgs.typescript}/bin/tsc --noEmit";

          test =
            mkHook "bun test"
            "${bun}/bin/bun test";
        };
      };
    in {
      formatter = pkgs.alejandra;

      checks = {
        pre-commit = hooks;

        typecheck =
          pkgs.runCommand "tsc-check" {
            buildInputs = [bun pkgs.typescript];
          } ''
            cd ${./.}
            bun install --frozen-lockfile
            tsc --noEmit
            touch $out
          '';

        test =
          pkgs.runCommand "bun-test" {
            buildInputs = [bun];
          } ''
            cd ${./.}
            bun install --frozen-lockfile
            bun test
            touch $out
          '';
      };

      devShells.default = pkgs.mkShell {
        packages =
          [
            bun
            node
            pkgs.typescript
            pkgs.biome
          ]
          ++ hooks.enabledPackages;

        NODE_ENV = "development";

        inherit (hooks) shellHook;
      };

      apps.default = {
        type = "app";
        program = "${pkgs.writeShellScriptBin "app" ''
          exec ${pkgs.bun}/bin/bun run ${./src/main.ts}
        ''}/bin/app";
      };
    });
}
