/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store.js'
// import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
// import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {

  beforeEach(() => {

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

  })

  describe("When I am on NewBill Page", () => {

    beforeEach(() => {

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

    })

    test("Then the mail icon in vertical layout should be highlighted", async () => {

      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains('active-icon')).toBe(true)

    })

    describe('When I select a file to upload', () => {

      test('Then the file should be handled properly if the type is allowed', () => {

        const newBillInstance = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

        const addFileBtn = document.querySelector('input[data-testid="file"]')
        const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' })
        const handleChangeFile = jest.fn(() => { newBillInstance.handleChangeFile })
        addFileBtn.addEventListener('change', handleChangeFile)
        fireEvent.change(addFileBtn, { target: { files: [file] } })

        expect(addFileBtn).toBeTruthy()
        expect(handleChangeFile).toHaveBeenCalled()
        expect(addFileBtn.files).toHaveLength(1)
        expect(addFileBtn.files[0].name).toBe('image.jpg')

      })

      test('Then an alert should fire and the file be dismissed if it does not have the right extension', () => {

        const newBillInstance = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

        jest.spyOn(window, 'alert').mockImplementation(() => { })
        const mockFile = { path: 'wrongFile.ext', type: 'ext' }
        const handleChangeFile = jest.fn(newBillInstance.handleChangeFile)
        const fileInput = document.querySelector('input[data-testid="file"]')
        fileInput.addEventListener('change', handleChangeFile)
        fireEvent.change(fileInput, { target: { files: [new File([mockFile['path']], mockFile['path'], { type: mockFile['type'] })] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith('Le justificatif doit être au format png ou jpeg.')
      })
    })

    describe('When I submit a valid form', () => {
      test('Then a new bill should be created', async () => {

        const newBillInstance = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

        const handleSubmitSpy = jest.spyOn(newBillInstance, 'handleSubmit')
        const updateBillSpy = jest.spyOn(newBillInstance, 'updateBill')

        const form = screen.getByTestId('form-new-bill')
        const submitBtn = form.querySelector('#btn-send-bill')

        form.addEventListener('submit', (e) => { newBillInstance.handleSubmit(e) })

        userEvent.click(submitBtn)

        await waitFor(() => {
          expect(handleSubmitSpy).toHaveBeenCalled()
          expect(updateBillSpy).toHaveBeenCalled()
        })
      })
    })
  })
})