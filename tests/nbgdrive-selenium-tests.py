import unittest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

DEFAULT_WAIT_TIME = 10
DEFAULT_LONG_WAIT_TIME = 120

class JupyterGdriveTesting(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()
        self.bmail = os.environ['BMAIL']
        self.user = os.environ['USER']
        self.password = os.environ['PASSWORD']

    def test_login_successfully(self):
        driver = self.driver
        driver.get("http://datahub-dev.berkeley.edu")
        self.loginFromGoogleScreen(driver)

        WebDriverWait(driver, DEFAULT_WAIT_TIME).until(EC.title_contains('Jupyter'))

        # At Jupyter Hub
        self.assertIn("Jupyter", driver.title)

        # Stop and start server
        driver.find_element_by_xpath("//a[@id='start']").click()
        WebDriverWait(driver, 120).until( \
            EC.presence_of_element_located((By.ID, "nbgdrive-link")))

        # Attempt to verify user, make sure button is on page
        self.assertIn("nbgdrive-link", driver.page_source)
        driver.find_element_by_xpath("//button[@id='nbgdrive-link']").click()

        # Get the gdrive auth code
        time.sleep(1)
        self.assertEqual(2, len(driver.window_handles))
        tree_window, auth_window = driver.window_handles
        driver.switch_to.window(auth_window)
        WebDriverWait(driver, DEFAULT_WAIT_TIME).until(EC.title_contains('Request'))
        self.assertIn("Request for Permission", driver.title)

        WebDriverWait(driver, DEFAULT_WAIT_TIME).until(EC.element_to_be_clickable((By.ID, "submit_approve_access")))
        driver.find_element_by_xpath("//button[@id='submit_approve_access']").click()
        WebDriverWait(driver, DEFAULT_WAIT_TIME).until( \
            EC.presence_of_element_located((By.ID, "code")))
        auth_code = driver.find_element_by_xpath("//input[@id='code']").get_attribute("value")

        # Insert and authorize the code
        driver.switch_to.window(tree_window)
        self.assertIn("nbgdrive-button", driver.page_source)
        auth_input = driver.find_element_by_xpath("//input[@id='nbgdrive-authentication']")
        auth_input.send_keys(auth_code)
        driver.find_element_by_xpath("//button[@id='nbgdrive-button']").click()

        # Ensure that newly added buttons are in page source
        time.sleep(1)
        self.assertIn("fa-cloud fa", driver.page_source)
        self.assertIn("fa-cloud-download fa", driver.page_source)
        self.assertIn("fa-sign-out fa", driver.page_source)

    def test_logout_successfully(self):
        driver = self.driver
        driver.get("http://datahub-dev.berkeley.edu")
        self.loginFromGoogleScreen(driver)
        WebDriverWait(driver, DEFAULT_WAIT_TIME).until(EC.title_contains('Jupyter'))

        # At Jupyter Hub
        self.assertIn("Jupyter", driver.title)

        # Stop and start server
        driver.find_element_by_xpath("//a[@id='start']").click()
        WebDriverWait(driver, DEFAULT_LONG_WAIT_TIME).until(EC.title_contains('Home'))
        time.sleep(2)
        WebDriverWait(driver, DEFAULT_LONG_WAIT_TIME).until( \
            EC.invisibility_of_element_located((By.ID, "nbgdrive-authenticated-result")))
        driver.find_element_by_xpath("//button[@class='btn btn-xs btn-default']").click()
        time.sleep(2)
        self.assertIn("nbgdrive-link", driver.page_source)

    def loginFromGoogleScreen(self, driver):
        google_sign_in = driver.find_element_by_xpath("//input[@id='Email']")
        google_sign_in.send_keys(self.bmail)
        driver.find_element_by_xpath("//input[@id='next']").click()
        # At Berkeley Sign In Page
        WebDriverWait(driver, DEFAULT_WAIT_TIME).until(EC.title_contains('CalNet'))
        self.assertIn("CalNet", driver.title)

        # Sign In (CalNet)
        calnet_sign_in = driver.find_element_by_xpath("//input[@id='username']")
        calnet_sign_in.send_keys(self.user)
        calnet_password = driver.find_element_by_xpath("//input[@id='password']")
        calnet_password.send_keys(self.password)
        driver.find_element_by_xpath("//input[@class='button']").click()

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()