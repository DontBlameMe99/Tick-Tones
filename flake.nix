{
  description = "TypeScript dev environment";

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
          deadnix.enable = true;
          flake-checker.enable = true;
          commitizen.enable = true;
          gitlint.enable = true;
          check-merge-conflicts.enable = true;
          forbid-new-submodules.enable = true;
          check-json.enable = true;
          lychee.enable = true;
          comrak.enable = true;
          ripsecrets.enable = true;
          typos.enable = true;
          check-toml.enable = true;
          check-yaml.enable = true;
          check-executables-have-shebangs.enable = true;
          check-shebang-scripts-are-executable.enable = true;
          check-added-large-files.enable = true;
          check-symlinks.enable = true;
          trim-trailing-whitespace.enable = true;
          shellcheck.enable = true;
          woodpecker-cli-lint.enable = true;

          biome.enable = true;
          html-tidy.enable = true;

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
