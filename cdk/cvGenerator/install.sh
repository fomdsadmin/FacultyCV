#!/bin/bash

mkdir latex_install

zcat < install-tl-unx.tar.gz | tar xf - --strip-components=1 -C latex_install

rm install-tl-unx.tar.gz

#echo 'selected_scheme scheme-small' > temp.profile

#output=$(perl ./latex_install/install-tl --no-interaction --paper=letter --profile temp.profile --location "https://ca.mirrors.cicku.me/ctan/systems/texlive/tlnet")

output=$(perl ./latex_install/install-tl --no-interaction --paper=letter --scheme=scheme-basic --location "https://ca.mirrors.cicku.me/ctan/systems/texlive/tlnet")

path_line=$(echo "$output" | grep "Most importantly,")

to_add_to_path=${path_line#*Most importantly, add }

mkdir -p /latex/

mv "${to_add_to_path%/*/*}"/* "/latex/"
