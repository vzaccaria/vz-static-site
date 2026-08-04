.PHONY: run sync

run: 
	npm run start

sync:
	$(MAKE) -C ../vz-personal-store export-site
	npm run courses:sync
