#!/usr/bin/python3

""" Selenium Tests for nbgdrive extension for Jupyter Notebooks"""
import unittest
import time
import os
import constants
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

class JupyterGdriveTesting(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()
        self.bmail = os.environ['BMAIL']
        self.user = os.environ['USER']
        self.password = os.environ['PASSWORD']

    def test_login_successfully(self):
        """ Tests to ensure that a user can retrieve the Google Drive authentication code
        and connect their Jupyter Notebook to their Google Drive """
        driver = self.driver
        self.loginToJupyterNotebook(driver)

        # Start Server
        driver.find_element_by_xpath("//a[@id='start']").click()
        WebDriverWait(driver, constants.START_SERVER_WAIT_PERIOD).until( \
            EC.presence_of_element_located((By.ID, "nbgdrive-link")))

        # Verify the user
        self.assertIn("nbgdrive-link", driver.page_source)
        driver.find_element_by_xpath("//button[@id='nbgdrive-link']").click()
        time.sleep(1)

        # Retrieve Google Drive Authentication Code
        self.assertEqual(2, len(driver.window_handles))
        tree_window, auth_window = driver.window_handles
        driver.switch_to.window(auth_window)
        WebDriverWait(driver, constants.DEFAULT_WAIT_PERIOD).until( \
            EC.title_contains(constants.GDRIVE_PAGE_TITLE))
        self.assertIn(constants.GDRIVE_PAGE_TITLE, driver.title)

        WebDriverWait(driver, constants.DEFAULT_WAIT_PERIOD).until( \
            EC.element_to_be_clickable((By.ID, "submit_approve_access")))
        driver.find_element_by_xpath("//button[@id='submit_approve_access']").click()
        WebDriverWait(driver, constants.DEFAULT_WAIT_PERIOD).until( \
            EC.presence_of_element_located((By.ID, "code")))
        auth_code = driver.find_element_by_xpath("//input[@id='code']").get_attribute("value")

        # Insert and authorize the code
        driver.switch_to.window(tree_window)
        self.assertIn("nbgdrive-button", driver.page_source)
        auth_input = driver.find_element_by_xpath("//input[@id='nbgdrive-authentication']")
        auth_input.send_keys(auth_code)
        driver.find_element_by_xpath("//button[@id='nbgdrive-button']").click()
        time.sleep(1)

        # Ensure that newly added buttons are in page source
        self.assertIn("fa-cloud fa", driver.page_source)
        self.assertIn("fa-cloud-download fa", driver.page_source)
        self.assertIn("fa-sign-out fa", driver.page_source)

    def test_logout_successfully(self):
        """ Tests to ensure that once a user is authenticated into Google Drive CLI,
        he or she can also log their account out and revoke rights """
        driver = self.driver
        self.loginToJupyterNotebook(driver)

        # Start Server
        driver.find_element_by_xpath("//a[@id='start']").click()
        WebDriverWait(driver, constants.START_SERVER_WAIT_PERIOD).until( \
            EC.title_contains(constants.NOTEBOOK_PAGE_TITLE))
        time.sleep(1)

        # Wait until Sync completes
        WebDriverWait(driver, constants.START_SERVER_WAIT_PERIOD).until( \
            EC.invisibility_of_element_located((By.ID, "nbgdrive-authenticated-result")))

        driver.find_element_by_xpath("//button[@class='btn btn-xs btn-default']").click()

        # Button to verify GDrive shows up again
        WebDriverWait(driver, constants.START_SERVER_WAIT_PERIOD).until( \
            EC.presence_of_element_located((By.ID, "nbgdrive-link")))
        self.assertIn("nbgdrive-link", driver.page_source)

    def loginToJupyterNotebook(self, driver):
        """ From the initial Google login landing page, navigates and signs in 
        using valid Berkeley credentials discerned from environment variables """
        driver.get(constants.DATAHUB_DEV_URL)

        # Verify Google
        driver.find_element_by_xpath("//input[@id='Email']").send_keys(self.bmail)
        driver.find_element_by_xpath("//input[@id='next']").click()
        
        # Verify CalNet
        WebDriverWait(driver, constants.DEFAULT_WAIT_PERIOD).until( \
            EC.title_contains(constants.CALNET_PAGE_TITLE))
        self.assertIn(constants.CALNET_PAGE_TITLE, driver.title)

        # Sign In via CalNet
        driver.find_element_by_xpath("//input[@id='username']").send_keys(self.user)
        driver.find_element_by_xpath("//input[@id='password']").send_keys(self.password)
        driver.find_element_by_xpath("//input[@class='button']").click()

        # Verify Login took us to correct location
        WebDriverWait(driver, constants.DEFAULT_WAIT_PERIOD).until( \
            EC.title_contains(constants.SERVER_PAGE_TITLE))
        self.assertIn(constants.SERVER_PAGE_TITLE, driver.title)

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()