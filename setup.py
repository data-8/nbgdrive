import setuptools

setuptools.setup(
    name="nbgdrive",
    version='1.0.0',
    url="https://github.com/data-8/nbgdrive",
    author="Blueprint",
    description="Simple Jupyter extension to allow user to sync files to google drive.",
    packages=setuptools.find_packages(),
    install_requires=[
        'notebook'
    ],
    package_data={'nbgdrive': ['static/*']},
)
