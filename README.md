# nbgdrive
A Google Drive extension for Jupyter notebook. Automatically creates a sync directory for the user on Google Drive and autosyncs their files every 24 hours. Adds a button to allow users to sync whenever they need to.

## Installation

You can currently install this directly from git:

```
pip install git+https://github.com/data-8/nbgdrive.git
jupyter serverextension enable --py nbgdrive
jupyter nbextension install --py nbgdrive
```

To enable this extension for all notebooks:

```
jupyter nbextension enable --py nbgdrive
```

## Usage

Once correctly installed, you can login with Google Drive in order to grant nbgdrive the required permissions to run.

![nbgdrive Screenshot 1](http://i.imgur.com/W0rCqrU.png)

You will be redirected to a new page where you will be given a verification code to insert back in a text field in the Jupyter Notebook, as shown below:

![nbgdrive Screenshot 2](http://i.imgur.com/FtEf5CK.png)

Once you are successfully logged in, you will be able to Sync manually by pressing the cloud button. Otherwise, nbgdrive will sync your directory automatically whenever you haven't synched in the past 24 hours.

![nbgdrive Screenshot 3](http://i.imgur.com/otdeMKD.png)

## Synching

Synching will create a sync folder in the main directory of your Google Drive, and upstream sync to it the contents of the Jupyter Notebook directory `/home/jovyan`.

Tampering with the contents or location of the sync folder will cause nbgdrive to break.
To fix any such issue, it's recommended to log out (through the logout button next to the sync button), and reauthenticate Google Drive.

## Cal Blueprint

![Blueprint Banner](https://cloud.githubusercontent.com/assets/2468904/11998649/8a12f970-aa5d-11e5-8dab-7eef0766c793.png)

This project was worked on in close collaboration with **[Cal Blueprint](http://www.calblueprint.org/)**. Cal Blueprint is a student-run UC Berkeley organization devoted to matching the skills of its members to our desire to see social good enacted in our community. Each semester, teams of 4-5 students work closely with a non-profit to bring technological solutions to the problems they face every day.
